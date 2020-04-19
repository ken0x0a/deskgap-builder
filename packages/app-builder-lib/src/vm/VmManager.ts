import { exec, ExtraSpawnOptions, spawn } from "builder-util";
import { ExecFileOptions, SpawnOptions } from "child_process";
import * as path from "path";

export class VmManager {
  get pathSep(): string {
    return path.sep;
  }

  exec(file: string, args: string[], options?: ExecFileOptions, isLogOutIfDebug = true): Promise<string> {
    return exec(file, args, options, isLogOutIfDebug);
  }

  spawn(file: string, args: string[], options?: SpawnOptions, extraOptions?: ExtraSpawnOptions): Promise<any> {
    return spawn(file, args, options, extraOptions);
  }

  toVmFile(file: string): string {
    return file;
  }
}
