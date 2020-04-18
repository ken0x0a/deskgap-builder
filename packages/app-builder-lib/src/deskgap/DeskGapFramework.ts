import BluebirdPromise from "bluebird-lst"
import { asArray, executeAppBuilder, log } from "builder-util"
import { CONCURRENCY, copyDir, DO_NOT_USE_HARD_LINKS, statOrNull, unlinkIfExists } from "builder-util/out/fs"
import { emptyDir, readdir, remove, rename } from "fs-extra"
import { Lazy } from "lazy-val"
import * as path from "path"
import { Configuration } from "../configuration"
import { BeforeCopyExtraFilesOptions, Framework, PrepareApplicationStageDirectoryOptions } from "../Framework"
import { Packager, Platform } from "../index"
import { LinuxPackager } from "../linuxPackager"
import MacPackager from "../macPackager"
import { isSafeToUnpackDeskGapOnRemoteBuildServer } from "../platformPackager"
import { getTemplatePath } from "../util/pathManager"
import { createMacApp } from "./deskgapMac"
import { computeDeskGapVersion, getDeskGapVersionFromInstalled } from "./deskgapVersion"

export type DeskGapPlatformName = "darwin" | "linux" | "win32" | "mas"

export interface DeskGapDownloadOptions {
  // https://github.com/deskgap-userland/deskgap-builder/issues/3077
  // must be optional
  version?: string

  /**
   * The [cache location](https://github.com/deskgap-userland/deskgap-download#cache-location).
   */
  cache?: string | null

  /**
   * The mirror.
   */
  mirror?: string | null

  /** @private */
  customDir?: string | null
  /** @private */
  customFilename?: string | null

  strictSSL?: boolean
  isVerifyChecksum?: boolean

  platform?: DeskGapPlatformName
  arch?: string
}

function createDownloadOpts(opts: Configuration, platform: DeskGapPlatformName, arch: string, deskgapVersion: string): DeskGapDownloadOptions {
  return {
    platform,
    arch,
    version: deskgapVersion,
    ...opts.deskgapDownload,
  }
}

async function beforeCopyExtraFiles(options: BeforeCopyExtraFilesOptions) {
  const packager = options.packager
  const appOutDir = options.appOutDir
  if (packager.platform === Platform.LINUX) {
    if (!isSafeToUnpackDeskGapOnRemoteBuildServer(packager)) {
      const linuxPackager = (packager as LinuxPackager)
      const executable = path.join(appOutDir, linuxPackager.executableName)
      await rename(path.join(appOutDir, "deskgap"), executable)
    }
  }
  else if (packager.platform === Platform.WINDOWS) {
    const executable = path.join(appOutDir, `${packager.appInfo.productFilename}.exe`)
    await rename(path.join(appOutDir, "deskgap.exe"), executable)
  }
  else {
    await createMacApp(packager as MacPackager, appOutDir, options.asarIntegrity, (options.platformName as DeskGapPlatformName) === "mas")

    const wantedLanguages = asArray(packager.platformSpecificBuildOptions.deskgapLanguages)
    if (wantedLanguages.length === 0) {
      return
    }

    // noinspection SpellCheckingInspection
    const langFileExt = ".lproj"
    const resourcesDir = packager.getResourcesDir(appOutDir)
    await BluebirdPromise.map(readdir(resourcesDir), file => {
      if (!file.endsWith(langFileExt)) {
        return
      }

      const language = file.substring(0, file.length - langFileExt.length)
      if (!wantedLanguages.includes(language)) {
        return remove(path.join(resourcesDir, file))
      }
      return
    }, CONCURRENCY)
  }
}

class DeskGapFramework implements Framework {
  // noinspection JSUnusedGlobalSymbols
  readonly macOsDefaultTargets = ["zip", "dmg"]
  // noinspection JSUnusedGlobalSymbols
  readonly defaultAppIdPrefix = "com.deskgap."
  // noinspection JSUnusedGlobalSymbols
  readonly isCopyElevateHelper = true
  // noinspection JSUnusedGlobalSymbols
  readonly isNpmRebuildRequired = true

  constructor(readonly name: string, readonly version: string, readonly distMacOsAppName: string) {
  }

  getDefaultIcon(platform: Platform) {
    if (platform === Platform.LINUX) {
      return path.join(getTemplatePath("icons"), "deskgap-linux")
    }
    else {
      // default icon is embedded into app skeleton
      return null
    }
  }

  prepareApplicationStageDirectory(options: PrepareApplicationStageDirectoryOptions) {
    return unpack(options, createDownloadOpts(options.packager.config, options.platformName, options.arch, this.version), this.distMacOsAppName)
  }

  beforeCopyExtraFiles(options: BeforeCopyExtraFilesOptions) {
    return beforeCopyExtraFiles(options)
  }
}

export async function createDeskGapFrameworkSupport(configuration: Configuration, packager: Packager): Promise<Framework> {
  let version = configuration.deskgapVersion
  if (version == null) {
    // for prepacked app asar no dev deps in the app.asar
    if (packager.isPrepackedAppAsar) {
      version = await getDeskGapVersionFromInstalled(packager.projectDir)
      if (version == null) {
        throw new Error(`Cannot compute deskgap version for prepacked asar`)
      }
    }
    else {
      version = await computeDeskGapVersion(packager.projectDir, new Lazy(() => Promise.resolve(packager.metadata)))
    }
    configuration.deskgapVersion = version
  }

  return new DeskGapFramework("deskgap", version, "DeskGap.app")
}

async function unpack(prepareOptions: PrepareApplicationStageDirectoryOptions, options: DeskGapDownloadOptions, distMacOsAppName: string) {
  const packager = prepareOptions.packager
  const out = prepareOptions.appOutDir

  let dist: string | null | undefined = packager.config.deskgapDist
  if (dist != null) {
    const zipFile = `deskgap-v${options.version}-${prepareOptions.platformName}-${options.arch}.zip`
    const resolvedDist = path.resolve(packager.projectDir, dist)
    if ((await statOrNull(path.join(resolvedDist, zipFile))) != null) {
      options.cache = resolvedDist
      dist = null
    }
  }

  let isFullCleanup = false
  if (dist == null) {
    if (isSafeToUnpackDeskGapOnRemoteBuildServer(packager)) {
      return
    }

    await executeAppBuilder(["unpack-deskgap", "--configuration", JSON.stringify([options]), "--output", out, "--distMacOsAppName", distMacOsAppName])
  }
  else {
    isFullCleanup = true
    const source = packager.getDeskGapSrcDir(dist)
    const destination = packager.getDeskGapDestinationDir(out)
    log.info({source, destination}, "copying DeskGap")
    await emptyDir(out)
    await copyDir(source, destination, {
      isUseHardLink: DO_NOT_USE_HARD_LINKS,
    })
  }

  await cleanupAfterUnpack(prepareOptions, distMacOsAppName, isFullCleanup)
}

function cleanupAfterUnpack(prepareOptions: PrepareApplicationStageDirectoryOptions, distMacOsAppName: string, isFullCleanup: boolean) {
  const out = prepareOptions.appOutDir
  const isMac = prepareOptions.packager.platform === Platform.MAC
  const resourcesPath = isMac ? path.join(out, distMacOsAppName, "Contents", "Resources") : path.join(out, "resources")

  return Promise.all([
    isFullCleanup ? unlinkIfExists(path.join(resourcesPath, "default_app.asar")) : Promise.resolve(),
    isFullCleanup ? unlinkIfExists(path.join(out, "version")) : Promise.resolve(),
    isMac ? Promise.resolve() : rename(path.join(out, "LICENSE"), path.join(out, "LICENSE.deskgap.txt")).catch(() => {/* ignore */}),
  ])
}
