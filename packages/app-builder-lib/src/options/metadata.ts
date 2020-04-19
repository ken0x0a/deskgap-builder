import { Configuration } from "../configuration";

export interface Metadata {
  readonly author?: AuthorMetadata | null;

  /**
   * The deskgap-builder configuration.
   */
  readonly build?: Configuration;

  /** @private */
  readonly dependencies?: { [key: string]: string };

  /**
   * The application description.
   */
  readonly description?: string;

  /**
   * The url to the project [homepage](https://docs.npmjs.com/files/package.json#homepage) (NuGet Package `projectUrl` (optional) or Linux Package URL (required)).
   *
   * If not specified and your project repository is public on GitHub, it will be `https://github.com/${user}/${project}` by default.
   */
  readonly homepage?: string | null;

  /**
   * *linux-only.* The [license](https://docs.npmjs.com/files/package.json#license) name.
   */
  readonly license?: string | null;
  /** @private */
  readonly main?: string | null;
  /**
   * The application name.
   * @required
   */
  readonly name?: string;
  /** @private */
  readonly productName?: string | null;

  /**
   * The [repository](https://docs.npmjs.com/files/package.json#repository).
   */
  readonly repository?: string | RepositoryInfo | null;
  /** @private */
  readonly shortVersion?: string | null;
  /** @private */
  readonly shortVersionWindows?: string | null;
  /** @private */
  readonly version?: string;
}

export interface AuthorMetadata {
  readonly email?: string;
  readonly name: string;
}

export interface RepositoryInfo {
  readonly url: string;
}
