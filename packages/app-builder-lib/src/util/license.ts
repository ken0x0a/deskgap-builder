import * as path from "path";
import { PlatformPackager } from "../platformPackager";
import { langIdToName, toLangWithRegion } from "./langs";

export function getLicenseAssets(fileNames: string[], packager: PlatformPackager<any>) {
  return fileNames
    .sort((a, b) => {
      const aW = a.includes("_en") ? 0 : 100;
      const bW = b.includes("_en") ? 0 : 100;
      return aW === bW ? a.localeCompare(b) : aW - bW;
    })
    .map((file) => {
      let lang = file.match(/_([^.]+)\./)![1];
      let langWithRegion;
      if (lang.includes("_")) {
        langWithRegion = lang;
        lang = langWithRegion.substring(0, lang.indexOf("_"));
      } else {
        lang = lang.toLowerCase();
        langWithRegion = toLangWithRegion(lang);
      }
      return {
        file: path.join(packager.buildResourcesDir, file),
        lang,
        langWithRegion,
        langName: (langIdToName as any)[lang],
      };
    });
}

export async function getNotLocalizedLicenseFile(
  custom: string | null | undefined,
  packager: PlatformPackager<any>,
  supportedExtension: string[] = ["rtf", "txt", "html"],
): Promise<string | null> {
  const possibleFiles: string[] = [];
  for (const name of ["license", "eula"])
    for (const ext of supportedExtension) {
      possibleFiles.push(`${name}.${ext}`);
      possibleFiles.push(`${name.toUpperCase()}.${ext}`);
      possibleFiles.push(`${name}.${ext.toUpperCase()}`);
      possibleFiles.push(`${name.toUpperCase()}.${ext.toUpperCase()}`);
    }

  return await packager.getResource(custom, ...possibleFiles);
}

export async function getLicenseFiles(packager: PlatformPackager<any>): Promise<LicenseFile[]> {
  return getLicenseAssets(
    (await packager.resourceList).filter((it) => {
      const name = it.toLowerCase();
      return (
        (name.startsWith("license_") || name.startsWith("eula_")) && (name.endsWith(".rtf") || name.endsWith(".txt"))
      );
    }),
    packager,
  );
}

export interface LicenseFile {
  file: string;
  lang: string;
  langName: string;
  langWithRegion: string;
}
