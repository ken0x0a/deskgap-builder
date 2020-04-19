import { FileTransformer } from "builder-util/out/fs";
import { AsarIntegrity } from "./asar/integrity";
import { AfterPackContext, DeskGapPlatformName, Platform, PlatformPackager } from "./index";

export interface Framework {
  readonly defaultAppIdPrefix: string;
  readonly distMacOsAppName: string;

  readonly isCopyElevateHelper: boolean;

  readonly isNpmRebuildRequired: boolean;
  readonly macOsDefaultTargets: string[];
  readonly name: string;
  readonly version: string;

  afterPack?(context: AfterPackContext): Promise<any>;

  beforeCopyExtraFiles?(options: BeforeCopyExtraFilesOptions): Promise<any>;

  createTransformer?(): FileTransformer | null;

  getDefaultIcon?(platform: Platform): string | null;

  getExcludedDependencies?(platform: Platform): string[] | null;

  getMainFile?(platform: Platform): string | null;

  prepareApplicationStageDirectory(options: PrepareApplicationStageDirectoryOptions): Promise<any>;
}

export interface BeforeCopyExtraFilesOptions {
  appOutDir: string;

  asarIntegrity: AsarIntegrity | null;
  packager: PlatformPackager<any>;

  // DeskGapPlatformName
  platformName: string;
}

export interface PrepareApplicationStageDirectoryOptions {
  /**
   * Platform doesn't process application output directory in any way. Unpack implementation must create or empty dir if need.
   */
  readonly appOutDir: string;
  readonly arch: string;
  readonly packager: PlatformPackager<any>;
  readonly platformName: DeskGapPlatformName;
  readonly version: string;
}

export function isDeskGapBased(framework: Framework): boolean {
  return framework.name === "deskgap";
}
