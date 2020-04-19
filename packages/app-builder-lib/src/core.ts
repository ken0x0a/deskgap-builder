import { Arch, archFromString, ArchType } from "builder-util";
import { AllPublishOptions } from "builder-util-runtime";
import { SnapStoreOptions } from "./publish/SnapStorePublisher";

// https://github.com/YousefED/typescript-json-schema/issues/80
export type Publish = AllPublishOptions | SnapStoreOptions | (AllPublishOptions | SnapStoreOptions)[] | null;

export type TargetConfigType = (string | TargetConfiguration)[] | string | TargetConfiguration | null;

export interface TargetConfiguration {
  /**
   * The arch or list of archs.
   */
  readonly arch?: ArchType[] | ArchType;
  /**
   * The target name. e.g. `snap`.
   */
  readonly target: string;
}

export class Platform {
  static LINUX = new Platform("linux", "linux", "linux");
  static MAC = new Platform("mac", "mac", "darwin");
  static WINDOWS = new Platform("windows", "win", "win32");

  static current(): Platform {
    return Platform.fromString(process.platform);
  }

  static fromString(name: string): Platform {
    name = name.toLowerCase();
    switch (name) {
      case Platform.MAC.nodeName:
      case Platform.MAC.name:
        return Platform.MAC;

      case Platform.WINDOWS.nodeName:
      case Platform.WINDOWS.name:
      case Platform.WINDOWS.buildConfigurationKey:
        return Platform.WINDOWS;

      case Platform.LINUX.nodeName:
        return Platform.LINUX;

      default:
        throw new Error(`Unknown platform: ${name}`);
    }
  }

  constructor(public name: string, public buildConfigurationKey: string, public nodeName: NodeJS.Platform) {}

  createTarget(type?: string | string[] | null, ...archs: Arch[]): Map<Platform, Map<Arch, string[]>> {
    if (type == null && (archs == null || archs.length === 0)) return new Map([[this, new Map()]]);

    const archToType = new Map();
    if (this === Platform.MAC) archs = [Arch.x64];

    for (const arch of archs == null || archs.length === 0 ? [archFromString(process.arch)] : archs)
      archToType.set(arch, type == null ? [] : Array.isArray(type) ? type : [type]);

    return new Map([[this, archToType]]);
  }

  toString() {
    return this.name;
  }
}

export abstract class Target {
  protected constructor(readonly name: string, readonly isAsyncSupported: boolean = true) {}

  abstract readonly options: TargetSpecificOptions | null | undefined;
  abstract readonly outDir: string;

  abstract build(appOutDir: string, arch: Arch): Promise<any>;

  async checkOptions(): Promise<any> {
    // ignore
  }

  finishBuild(): Promise<any> {
    return Promise.resolve();
  }
}

export interface TargetSpecificOptions {
  /**
   The [artifact file name template](/configuration/configuration#artifact-file-name-template).
   */
  readonly artifactName?: string | null;

  publish?: Publish;
}

export const DEFAULT_TARGET = "default";
export const DIR_TARGET = "dir";

export type CompressionLevel = "store" | "normal" | "maximum";

export interface BeforeBuildContext {
  readonly appDir: string;
  readonly arch: string;
  readonly deskgapVersion: string;
  readonly platform: Platform;
}

export interface SourceRepositoryInfo {
  domain?: string;
  project: string;
  type?: string;
  user: string;
}
