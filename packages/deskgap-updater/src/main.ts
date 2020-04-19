import { CancellationToken, PackageFileInfo, ProgressInfo, UpdateFileInfo, UpdateInfo } from "builder-util-runtime";
import { EventEmitter } from "events";
import { URL } from "url";
import { AppUpdater } from "./AppUpdater";
import { LoginCallback } from "./deskgapHttpExecutor";

export { AppUpdater, NoOpLogger } from "./AppUpdater";
export { UpdateInfo };
export { CancellationToken } from "builder-util-runtime";
export { Provider } from "./providers/Provider";
export { AppImageUpdater } from "./AppImageUpdater";
export { MacUpdater } from "./MacUpdater";
export { NsisUpdater } from "./NsisUpdater";

// autoUpdater to mimic deskgap bundled autoUpdater
let _autoUpdater: any;

// required for jsdoc
export declare const autoUpdater: AppUpdater;

function doLoadAutoUpdater(): AppUpdater {
  // tslint:disable:prefer-conditional-expression
  if (process.platform === "win32") _autoUpdater = new (require("./NsisUpdater").NsisUpdater)();
  else if (process.platform === "darwin") _autoUpdater = new (require("./MacUpdater").MacUpdater)();
  else _autoUpdater = new (require("./AppImageUpdater").AppImageUpdater)();

  return _autoUpdater;
}

Object.defineProperty(exports, "autoUpdater", {
  enumerable: true,
  get: () => {
    return _autoUpdater || doLoadAutoUpdater();
  },
});

export interface ResolvedUpdateFileInfo {
  readonly info: UpdateFileInfo;

  packageInfo?: PackageFileInfo;
  readonly url: URL;
}

export function getChannelFilename(channel: string): string {
  return `${channel}.yml`;
}

export interface UpdateCheckResult {
  readonly cancellationToken?: CancellationToken;

  readonly downloadPromise?: Promise<string[]> | null;
  readonly updateInfo: UpdateInfo;

  /** @deprecated */
  readonly versionInfo: UpdateInfo;
}

export type UpdaterEvents =
  | "login"
  | "checking-for-update"
  | "update-available"
  | "update-cancelled"
  | "download-progress"
  | "update-downloaded"
  | "error";

export const DOWNLOAD_PROGRESS: UpdaterEvents = "download-progress";
export const UPDATE_DOWNLOADED: UpdaterEvents = "update-downloaded";

export type LoginHandler = (authInfo: any, callback: LoginCallback) => void;

export class UpdaterSignal {
  constructor(private readonly emitter: EventEmitter) {}

  /**
   * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/deskgap/deskgap/blob/master/docs/api/client-request.md#event-login).
   */
  login(handler: LoginHandler): void {
    addHandler(this.emitter, "login", handler);
  }

  progress(handler: (info: ProgressInfo) => void): void {
    addHandler(this.emitter, DOWNLOAD_PROGRESS, handler);
  }

  updateCancelled(handler: (info: UpdateInfo) => void): void {
    addHandler(this.emitter, "update-cancelled", handler);
  }

  updateDownloaded(handler: (info: UpdateDownloadedEvent) => void): void {
    addHandler(this.emitter, UPDATE_DOWNLOADED, handler);
  }
}

export interface UpdateDownloadedEvent extends UpdateInfo {
  downloadedFile: string;
}

const isLogEvent = false;

function addHandler(emitter: EventEmitter, event: UpdaterEvents, handler: (...args: any[]) => void): void {
  if (isLogEvent)
    emitter.on(event, (...args: any[]) => {
      console.log("%s %s", event, args);
      handler(...args);
    });
  else emitter.on(event, handler);
}

export interface Logger {
  debug?(message: string): void;

  error(message?: any): void;
  info(message?: any): void;

  warn(message?: any): void;
}

// if baseUrl path doesn't ends with /, this path will be not prepended to passed pathname for new URL(input, base)
/** @internal */
export function newBaseUrl(url: string): URL {
  const result = new URL(url);
  if (!result.pathname.endsWith("/")) result.pathname += "/";

  return result;
}

// addRandomQueryToAvoidCaching is false by default because in most cases URL already contains version number,
// so, it makes sense only for Generic Provider for channel files
export function newUrlFromBase(pathname: string, baseUrl: URL, addRandomQueryToAvoidCaching = false): URL {
  const result = new URL(pathname, baseUrl);
  // search is not propagated (search is an empty string if not specified)
  const { search } = baseUrl;
  if (search != null && search.length !== 0) result.search = search;
  else if (addRandomQueryToAvoidCaching) result.search = `noCache=${Date.now().toString(32)}`;

  return result;
}
