import { Arch } from "builder-util";
import { PublishConfiguration } from "builder-util-runtime";
import { UploadTask } from "deskgap-publish";
import { Configuration } from "./configuration";
import { Platform, Target } from "./core";
import { Packager } from "./packager";
import { PlatformPackager } from "./platformPackager";

export interface PackagerOptions {
  readonly config?: Configuration | string | null;

  readonly effectiveOptionComputed?: (options: any) => Promise<boolean>;
  linux?: string[];

  mac?: string[];

  platformPackagerFactory?: ((info: Packager, platform: Platform) => PlatformPackager<any>) | null;

  readonly prepackaged?: string | null;

  projectDir?: string | null;
  targets?: Map<Platform, Map<Arch, string[]>>;
  win?: string[];
}

export interface ArtifactCreated extends UploadTask {
  readonly isWriteUpdateInfo?: boolean;
  readonly packager: PlatformPackager<any>;

  readonly publishConfig?: PublishConfiguration | null;

  readonly safeArtifactName?: string | null;
  readonly target: Target | null;

  updateInfo?: any;
}

export interface ArtifactBuildStarted {
  // null for NSIS
  readonly arch: Arch | null;

  readonly file: string;
  readonly targetPresentableName: string;
}
