import { debug, deepAssign, log } from "builder-util";
import { FileTransformer } from "builder-util/out/fs";
import { readFile } from "fs-extra";
import * as path from "path";
import { Configuration } from "./configuration";
import { Packager } from "./packager";

/** @internal */
export const NODE_MODULES_PATTERN = `${path.sep}node_modules${path.sep}`;

/** @internal */
export function isDeskGapCompileUsed(info: Packager): boolean {
  if (info.config.deskgapCompile != null) return info.config.deskgapCompile;

  // if in devDependencies - it means that babel is used for precompilation or for some reason user decided to not use deskgap-compile for production
  return hasDep("deskgap-compile", info);
}

/** @internal */
export function hasDep(name: string, info: Packager) {
  const deps = info.metadata.dependencies;
  return deps != null && name in deps;
}

/** @internal */
export function createTransformer(
  srcDir: string,
  configuration: Configuration,
  extraMetadata: any,
  extraTransformer: FileTransformer | null,
): FileTransformer {
  const mainPackageJson = path.join(srcDir, "package.json");
  const isRemovePackageScripts = configuration.removePackageScripts !== false;
  const packageJson = `${path.sep}package.json`;
  return (file) => {
    if (file === mainPackageJson) return modifyMainPackageJson(file, extraMetadata, isRemovePackageScripts);

    if (file.endsWith(packageJson) && file.includes(NODE_MODULES_PATTERN))
      return readFile(file, "utf-8")
        .then((it) =>
          cleanupPackageJson(JSON.parse(it), {
            isMain: false,
            isRemovePackageScripts,
          }),
        )
        .catch((e) => log.warn(e));

    if (extraTransformer != null) return extraTransformer(file);

    return null;
  };
}

/** @internal */
export interface CompilerHost {
  compile(file: string): any;

  saveConfiguration(): Promise<any>;
}

/** @internal */
export function createDeskGapCompilerHost(projectDir: string, cacheDir: string): Promise<CompilerHost> {
  const deskgapCompilePath = path.join(projectDir, "node_modules", "deskgap-compile", "lib");
  return require(path.join(deskgapCompilePath, "config-parser")).createCompilerHostFromProjectRoot(
    projectDir,
    cacheDir,
  );
}

const ignoredPackageMetadataProperties = new Set([
  "dist",
  "gitHead",
  "keywords",
  "build",
  "jspm",
  "ava",
  "xo",
  "nyc",
  "eslintConfig",
  "contributors",
  "bundleDependencies",
  "tags",
]);

interface CleanupPackageFileOptions {
  readonly isMain: boolean;
  readonly isRemovePackageScripts: boolean;
}

function cleanupPackageJson(data: any, options: CleanupPackageFileOptions): any {
  const deps = data.dependencies;
  // https://github.com/deskgap-userland/deskgap-builder/issues/507#issuecomment-312772099
  const isRemoveBabel =
    deps != null && typeof deps === "object" && !Object.getOwnPropertyNames(deps).some((it) => it.startsWith("babel"));
  try {
    let changed = false;
    // removing devDependencies from package.json breaks levelup in deskgap, so, remove it only from main package.json
    for (const prop of Object.getOwnPropertyNames(data))
      if (
        prop.startsWith("_") ||
        ignoredPackageMetadataProperties.has(prop) ||
        (options.isRemovePackageScripts && prop === "scripts") ||
        (options.isMain && prop === "devDependencies") ||
        (!options.isMain && prop === "bugs") ||
        (isRemoveBabel && prop === "babel")
      ) {
        delete data[prop];
        changed = true;
      }

    if (changed) return JSON.stringify(data, null, 2);
  } catch (e) {
    debug(e);
  }

  return null;
}

async function modifyMainPackageJson(file: string, extraMetadata: any, isRemovePackageScripts: boolean) {
  const mainPackageData = JSON.parse(await readFile(file, "utf-8"));
  if (extraMetadata != null) deepAssign(mainPackageData, extraMetadata);

  // https://github.com/deskgap-userland/deskgap-builder/issues/1212
  const serializedDataIfChanged = cleanupPackageJson(mainPackageData, {
    isMain: true,
    isRemovePackageScripts,
  });
  if (serializedDataIfChanged != null) return serializedDataIfChanged;

  if (extraMetadata != null) return JSON.stringify(mainPackageData, null, 2);

  return null;
}
