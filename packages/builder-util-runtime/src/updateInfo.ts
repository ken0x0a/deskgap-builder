export interface ReleaseNoteInfo {
  /**
   * The note.
   */
  readonly note: string | null;
  /**
   * The version.
   */
  readonly version: string;
}

export interface BlockMapDataHolder {
  /**
   * The block map file size. Used when block map data is embedded into the file (appimage, windows web installer package).
   * This information can be obtained from the file itself, but it requires additional HTTP request,
   * so, to reduce request count, block map size is specified in the update metadata too.
   */
  blockMapSize?: number;

  readonly isAdminRightsRequired?: boolean;

  /**
   * The file checksum.
   */
  readonly sha512: string;
  /**
   * The file size. Used to verify downloaded size (save one HTTP request to get length).
   * Also used when block map data is embedded into the file (appimage, windows web installer package).
   */
  size?: number;
}

export interface PackageFileInfo extends BlockMapDataHolder {
  readonly path: string;
}

export interface UpdateFileInfo extends BlockMapDataHolder {
  url: string;
}

export interface UpdateInfo {
  readonly files: UpdateFileInfo[];

  /** @deprecated */
  readonly path: string;

  /**
   * The release date.
   */
  releaseDate: string;

  /**
   * The release name.
   */
  releaseName?: string | null;

  /**
   * The release notes. List if `updater.fullChangelog` is set to `true`, `string` otherwise.
   */
  releaseNotes?: string | ReleaseNoteInfo[] | null;

  /** @deprecated */
  readonly sha512: string;

  /**
   * The [staged rollout](/auto-update#staged-rollouts) percentage, 0-100.
   */
  readonly stagingPercentage?: number;
  /**
   * The version.
   */
  readonly version: string;
}

export interface WindowsUpdateInfo extends UpdateInfo {
  packages?: { [arch: string]: PackageFileInfo } | null;

  /**
   * @deprecated
   * @private
   */
  sha2?: string;
}
