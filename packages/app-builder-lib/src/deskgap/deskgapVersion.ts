import { InvalidConfigurationError, log } from "builder-util"
import { parseXml } from "builder-util-runtime"
import { httpExecutor } from "builder-util/out/nodeHttpExecutor"
import { readJson } from "fs-extra"
import { Lazy } from "lazy-val"
import * as path from "path"
import { orNullIfFileNotExist } from "read-config-file"
import * as findWorkspaceRoot from "find-yarn-workspace-root"

import * as semver from "semver"
import { Configuration } from "../configuration"
import { getConfig } from "../util/config"

export type MetadataValue = Lazy<{ [key: string]: any } | null>

const deskgapPackages = ["deskgap", "deskgap-prebuilt", "deskgap-prebuilt-compile", "deskgap-nightly"]

export async function getDeskGapVersion(
  projectDir: string,
  config?: Configuration,
  projectMetadata: MetadataValue = new Lazy(() => orNullIfFileNotExist(readJson(path.join(projectDir, "package.json"))))
): Promise<string> {
  if (config == null) {
    config = await getConfig(projectDir, null, null)
  }
  if (config.deskgapVersion != null) {
    return config.deskgapVersion
  }
  return await computeDeskGapVersion(projectDir, projectMetadata)
}

export async function getDeskGapVersionFromInstalled(projectDir: string): Promise<string | undefined> {
  for (const name of deskgapPackages) {
    try {
      return (await readJson(path.join(projectDir, "node_modules", name, "package.json"))).version
    } catch (e) {
      try {
        const pkgJsonPath = path.join(
          findWorkspaceRoot(process.cwd()) ?? __dirname,
          "node_modules",
          name,
          "package.json"
        )
        return (await readJson(pkgJsonPath)).version
      } catch (e) {
        if (e.code !== "ENOENT") {
          log.warn({ name, error: e }, `cannot read deskgap version package.json`)
        }
      }
    }
  }
}

export async function getDeskGapPackage(projectDir: string) {
  for (const name of deskgapPackages) {
    try {
      return await readJson(path.join(projectDir, "node_modules", name, "package.json"))
    } catch (e) {
      if (e.code !== "ENOENT") {
        log.warn({ name, error: e }, `cannot find deskgap in package.json`)
      }
    }
  }
  return null
}

/** @internal */
export async function computeDeskGapVersion(projectDir: string, projectMetadata: MetadataValue): Promise<string> {
  const result = await getDeskGapVersionFromInstalled(projectDir)
  console.log("\x1b[33mVersion from %s\x1b[0m", result)
  if (result !== undefined) {
    return result
  }

  const dependency = findFromPackageMetadata(await projectMetadata!!.value)
  if (dependency?.name === "deskgap-nightly") {
    log.info("You are using a nightly version of deskgap, be warned that those builds are highly unstable.")
    const feedXml = await httpExecutor.request({
      hostname: "github.com",
      path: `/deskgap/nightlies/releases.atom`,
      headers: {
        accept: "application/xml, application/atom+xml, text/xml, */*",
      },
    })
    const feed = parseXml(feedXml!!)
    const latestRelease = feed.element("entry", false, `No published versions on GitHub`)
    const v = latestRelease
      .element("link")
      .attribute("href")
      .match(/\/tag\/v?([^/]+)$/)!![1]
    return v.startsWith("v") ? v.substring(1) : v
  } else if (dependency?.version === "latest") {
    log.warn(
      'DeskGap version is set to "latest", but it is recommended to set it to some more restricted version range.'
    )
    try {
      const releaseInfo = JSON.parse(
        (await httpExecutor.request({
          hostname: "github.com",
          path: `/deskgap/${dependency.name === "deskgap-nightly" ? "nightlies" : "deskgap"}/releases/latest`,
          headers: {
            accept: "application/json",
          },
        }))!!
      )
      const version = releaseInfo.tag_name.startsWith("v") ? releaseInfo.tag_name.substring(1) : releaseInfo.tag_name
      log.info({ version }, `resolve ${dependency.name}@${dependency.version}`)
      return version
    } catch (e) {
      log.warn(e)
    }

    throw new InvalidConfigurationError(
      `Cannot find deskgap dependency to get deskgap version in the '${path.join(projectDir, "package.json")}'`
    )
  }

  const version = dependency?.version
  if (version == null || !/^\d/.test(version)) {
    const versionMessage = version == null ? "" : ` and version ("${version}") is not fixed in project`
    throw new InvalidConfigurationError(
      `Cannot compute deskgap version from installed node modules - none of the possible deskgap modules are installed${versionMessage}.\nSee https://github.com/deskgap-userland/deskgap-builder/issues/3984#issuecomment-504968246`
    )
  }

  return semver.coerce(version)!!.toString()
}

interface NameAndVersion {
  readonly name: string
  readonly version: string
}

function findFromPackageMetadata(packageData: any): NameAndVersion | null {
  for (const name of deskgapPackages) {
    const devDependencies = packageData.devDependencies
    let dep = devDependencies == null ? null : devDependencies[name]
    if (dep == null) {
      const dependencies = packageData.dependencies
      dep = dependencies == null ? null : dependencies[name]
    }
    if (dep != null) {
      return { name, version: dep }
    }
  }
  return null
}
