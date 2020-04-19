import { log } from "builder-util";
import { statOrNull } from "builder-util/out/fs";
import * as path from "path";
import { Configuration } from "../configuration";

/** @internal */
export async function reactCra(projectDir: string): Promise<Configuration> {
  if ((await statOrNull(path.join(projectDir, "public", "deskgap.js"))) == null)
    // noinspection SpellCheckingInspection
    log.warn(
      "public/deskgap.js not found. Please see https://medium.com/@kitze/%EF%B8%8F-from-react-to-an-deskgap-app-ready-for-production-a0468ecb1da3",
    );

  return {
    directories: {
      buildResources: "assets",
    },
    files: ["build/**/*"],
    extraMetadata: {
      main: "build/deskgap.js",
    },
  };
}
