import * as path from "path";
import { AppAdapter, getAppCacheDir } from "./AppAdapter";

export class DeskGapAppAdapter implements AppAdapter {
  get appUpdateConfigPath(): string {
    return this.isPackaged
      ? path.join(process.resourcesPath!, "app-update.yml")
      : path.join(this.app.getAppPath(), "dev-app-update.yml");
  }

  get baseCachePath(): string {
    return getAppCacheDir();
  }

  get isPackaged(): boolean {
    return this.app.isPackaged === true;
  }

  get name(): string {
    return this.app.getName();
  }

  get userDataPath(): string {
    return this.app.getPath("userData");
  }

  get version(): string {
    return this.app.getVersion();
  }

  constructor(private readonly app = require("deskgap").app) {}

  onQuit(handler: (exitCode: number) => void): void {
    this.app.once("quit", (_: Event, exitCode: number) => handler(exitCode));
  }

  quit(): void {
    this.app.quit();
  }

  whenReady(): Promise<void> {
    return this.app.whenReady();
  }
}
