import * as path from "path";

export interface AppAdapter {
  /**
   * Path to update metadata file.
   */
  readonly appUpdateConfigPath: string;

  /**
   * Path to cache directory.
   */
  readonly baseCachePath: string;

  readonly isPackaged: boolean;
  readonly name: string;

  /**
   * Path to user data directory.
   */
  readonly userDataPath: string;
  readonly version: string;

  onQuit(handler: (exitCode: number) => void): void;

  quit(): void;

  whenReady(): Promise<void>;
}

export function getAppCacheDir() {
  const homedir = require("os").homedir();
  // https://github.com/deskgap/deskgap/issues/1404#issuecomment-194391247
  let result: string;
  if (process.platform === "win32") result = process.env.LOCALAPPDATA || path.join(homedir, "AppData", "Local");
  else if (process.platform === "darwin") result = path.join(homedir, "Library", "Application Support", "Caches");
  else result = process.env.XDG_CACHE_HOME || path.join(homedir, ".cache");

  return result;
}
