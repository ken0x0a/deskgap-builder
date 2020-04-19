import { AsarIntegrityOptions } from "../asar/integrity";
import { CompressionLevel, Publish, TargetConfiguration, TargetSpecificOptions } from "../core";
import { FileAssociation } from "./FileAssociation";

export interface FileSet {
  /**
   * The [glob patterns](/file-patterns).
   */
  filter?: string[] | string;
  /**
   * The source path relative to the project directory.
   */
  from?: string;
  /**
   * The destination path relative to the app's content directory for `extraFiles` and the app's resource directory for `extraResources`.
   */
  to?: string;
}

export interface AsarOptions extends AsarIntegrityOptions {
  ordering?: string | null;
  /**
   * Whether to automatically unpack executables files.
   * @default true
   */
  smartUnpack?: boolean;
}

export interface PlatformSpecificBuildOptions extends TargetSpecificOptions {
  /**
   * The application id. Used as [CFBundleIdentifier](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102070) for MacOS and as
   * [Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) for Windows (NSIS target only, Squirrel.Windows not supported). It is strongly recommended that an explicit ID is set.
   * @default com.deskgap.${name}
   */
  readonly appId?: string | null;

  /**
   * The [artifact file name template](/configuration/configuration#artifact-file-name-template). Defaults to `${productName}-${version}.${ext}` (some target can have other defaults, see corresponding options).
   */
  readonly artifactName?: string | null;

  /**
   * Whether to package the application's source code into an archive, using [DeskGap's archive format](http://deskgap.atom.io/docs/tutorial/application-packaging/).
   *
   * Node modules, that must be unpacked, will be detected automatically, you don't need to explicitly set [asarUnpack](#configuration-asarUnpack) - please file an issue if this doesn't work.
   * @default true
   */
  readonly asar?: AsarOptions | boolean | null;

  /**
   * A [glob patterns](/file-patterns) relative to the [app directory](#MetadataDirectories-app), which specifies which files to unpack when creating the [asar](http://deskgap.atom.io/docs/tutorial/application-packaging/) archive.
   */
  readonly asarUnpack?: string[] | string | null;

  /**
   * The compression level. If you want to rapidly test build, `store` can reduce build time significantly. `maximum` doesn't lead to noticeable size difference, but increase build time.
   * @default normal
   */
  readonly compression?: CompressionLevel | null;

  /** @private */
  cscKeyPassword?: string | null;

  /** @private */
  cscLink?: string | null;

  /**
   * The [deskgap-updater compatibility](/auto-update#compatibility) semver range.
   */
  readonly deskgapUpdaterCompatibility?: string | null;

  /**
   * Whether to infer update channel from application version pre-release components. e.g. if version `0.12.1-alpha.1`, channel will be set to `alpha`. Otherwise to `latest`.
   * @default true
   */
  readonly detectUpdateChannel?: boolean;
  extraFiles?: (FileSet | string)[] | FileSet | string | null;
  extraResources?: (FileSet | string)[] | FileSet | string | null;

  /**
   * The file associations.
   */
  readonly fileAssociations?: FileAssociation[] | FileAssociation;

  files?: (FileSet | string)[] | FileSet | string | null;

  /**
   * Whether to fail if app will be not code signed.
   */
  readonly forceCodeSigning?: boolean;

  /**
   * Please see [Building and Releasing using Channels](https://github.com/deskgap-userland/deskgap-builder/issues/1182#issuecomment-324947139).
   * @default false
   */
  readonly generateUpdatesFilesForAllChannels?: boolean;

  /** @private */
  readonly icon?: string | null;
  /**
   * The URL protocol schemes.
   */
  readonly protocols?: Protocol[] | Protocol;

  publish?: Publish;

  /**
   * The release info. Intended for command line usage:
   *
   * ```
   * -c.releaseInfo.releaseNotes="new features"
   * ```
   */
  readonly releaseInfo?: ReleaseInfo;

  readonly target?: (string | TargetConfiguration)[] | string | TargetConfiguration | null;
}

export interface ReleaseInfo {
  /**
   * The release date.
   */
  releaseDate?: string;
  /**
   * The release name.
   */
  releaseName?: string | null;

  /**
   * The release notes.
   */
  releaseNotes?: string | null;

  /**
   * The path to release notes file. Defaults to `release-notes-${platform}.md` (where `platform` it is current platform — `mac`, `linux` or `windows`) or `release-notes.md` in the [build resources](#MetadataDirectories-buildResources).
   */
  releaseNotesFile?: string | null;
}

/**
 * URL Protocol Schemes. Protocols to associate the app with. macOS only.
 *
 * Please note — on macOS [you need to register an `open-url` event handler](http://deskgap.atom.io/docs/api/app/#event-open-url-macos).
 */
export interface Protocol {
  /**
   * The name. e.g. `IRC server URL`.
   */
  readonly name: string;

  /**
   * *macOS-only* The app’s role with respect to the type.
   * @default Editor
   */
  readonly role?: "Editor" | "Viewer" | "Shell" | "None";

  /**
   * The schemes. e.g. `["irc", "ircs"]`.
   */
  readonly schemes: string[];
}
