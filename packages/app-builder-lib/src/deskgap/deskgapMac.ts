import * as BluebirdPromise from "bluebird-lst";
import { asArray, getPlatformIconFileName, InvalidConfigurationError, log } from "builder-util";
import { copyOrLinkFile, unlinkIfExists } from "builder-util/out/fs";
import { rename, utimes } from "fs-extra";
import * as path from "path";
// import { filterCFBundleIdentifier } from "../appInfo"
import { AsarIntegrity } from "../asar/integrity";
import MacPackager from "../macPackager";
import { normalizeExt } from "../platformPackager";
import { executeAppBuilderAndWriteJson, executeAppBuilderAsJson } from "../util/appBuilder";

function doRename(basePath: string, oldName: string, newName: string) {
  return rename(path.join(basePath, oldName), path.join(basePath, newName));
}

/** @internal */
export async function createMacApp(
  packager: MacPackager,
  appOutDir: string,
  asarIntegrity: AsarIntegrity | null,
  isMas: boolean,
) {
  const { appInfo } = packager;
  const appFilename = appInfo.productFilename;

  const contentsPath = path.join(appOutDir, packager.info.framework.distMacOsAppName, "Contents");
  // const frameworksPath = path.join(contentsPath, "Frameworks")
  // const loginItemPath = path.join(contentsPath, "Library", "LoginItems")

  const appPlistFilename = path.join(contentsPath, "Info.plist");

  const plistContent: any[] = await executeAppBuilderAsJson(["decode-plist", "-f"]);

  if (plistContent[0] == null) throw new Error("corrupted DeskGap dist");

  const appPlist = plistContent[0]!;

  // if an extend-info file was supplied, copy its contents in first
  if (plistContent[8] != null) Object.assign(appPlist, plistContent[8]);

  const buildMetadata = packager.config;

  /**
   * Configure bundleIdentifier for the generic DeskGap Helper process
   *
   * This was the only Helper in DeskGap 5 and before. Allow users to configure
   * the bundleIdentifier for continuity.
   */

  const oldHelperBundleId = (buildMetadata as any)["helper-bundle-id"];
  if (oldHelperBundleId != null)
    log.warn("build.helper-bundle-id is deprecated, please set as build.mac.helperBundleId");

  await packager.applyCommonInfo(appPlist, contentsPath);

  // required for deskgap-updater proxy
  if (!isMas) configureLocalhostAts(appPlist);

  const protocols = asArray(buildMetadata.protocols).concat(asArray(packager.platformSpecificBuildOptions.protocols));
  if (protocols.length > 0)
    appPlist.CFBundleURLTypes = protocols.map((protocol) => {
      const schemes = asArray(protocol.schemes);
      if (schemes.length === 0)
        throw new InvalidConfigurationError(`Protocol "${protocol.name}": must be at least one scheme specified`);

      return {
        CFBundleURLName: protocol.name,
        CFBundleTypeRole: protocol.role || "Editor",
        CFBundleURLSchemes: schemes.slice(),
      };
    });

  const { fileAssociations } = packager;
  if (fileAssociations.length > 0)
    appPlist.CFBundleDocumentTypes = await BluebirdPromise.map(fileAssociations, async (fileAssociation) => {
      const extensions = asArray(fileAssociation.ext).map(normalizeExt);
      const customIcon = await packager.getResource(
        getPlatformIconFileName(fileAssociation.icon, true),
        `${extensions[0]}.icns`,
      );
      let iconFile = appPlist.CFBundleIconFile;
      if (customIcon != null) {
        iconFile = path.basename(customIcon);
        await copyOrLinkFile(customIcon, path.join(path.join(contentsPath, "Resources"), iconFile));
      }

      const result = {
        CFBundleTypeExtensions: extensions,
        CFBundleTypeName: fileAssociation.name || extensions[0],
        CFBundleTypeRole: fileAssociation.role || "Editor",
        CFBundleTypeIconFile: iconFile,
      } as any;

      if (fileAssociation.isPackage) result.LSTypeIsPackage = true;

      return result;
    });

  if (asarIntegrity != null) appPlist.AsarIntegrity = JSON.stringify(asarIntegrity);

  const plistDataToWrite: any = {
    [appPlistFilename]: appPlist,
  };

  await Promise.all([
    executeAppBuilderAndWriteJson(["encode-plist"], plistDataToWrite),
    doRename(path.join(contentsPath, "MacOS"), "DeskGap", appPlist.CFBundleExecutable),
    unlinkIfExists(path.join(appOutDir, "LICENSE")),
    unlinkIfExists(path.join(appOutDir, "LICENSES.chromium.html")),
  ]);

  const appPath = path.join(appOutDir, `${appFilename}.app`);
  await rename(path.dirname(contentsPath), appPath);
  // https://github.com/deskgap-userland/deskgap-builder/issues/840
  const now = Date.now() / 1000;
  await utimes(appPath, now, now);
}

function configureLocalhostAts(appPlist: any) {
  // https://bencoding.com/2015/07/20/app-transport-security-and-localhost/
  let ats = appPlist.NSAppTransportSecurity;
  if (ats == null) {
    ats = {};
    appPlist.NSAppTransportSecurity = ats;
  }

  ats.NSAllowsLocalNetworking = true;
  // https://github.com/deskgap-userland/deskgap-builder/issues/3377#issuecomment-446035814
  ats.NSAllowsArbitraryLoads = true;

  let exceptionDomains = ats.NSExceptionDomains;
  if (exceptionDomains == null) {
    exceptionDomains = {};
    ats.NSExceptionDomains = exceptionDomains;
  }

  if (exceptionDomains.localhost == null) {
    const allowHttp = {
      NSTemporaryExceptionAllowsInsecureHTTPSLoads: false,
      NSIncludesSubdomains: false,
      NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
      NSTemporaryExceptionMinimumTLSVersion: "1.0",
      NSTemporaryExceptionRequiresForwardSecrecy: false,
    };
    exceptionDomains.localhost = allowHttp;
    exceptionDomains["127.0.0.1"] = allowHttp;
  }
}
