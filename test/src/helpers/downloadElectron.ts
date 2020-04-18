import { isCI as isCi } from "ci-info"
import * as path from "path"
import { promises as fs } from "fs"
import { ELECTRON_VERSION, getDeskGapCacheDir } from "./testConfig"

const executeAppBuilder: (options: any) => Promise<any> = require(path.join(__dirname, "../../..", "packages/builder-util")).executeAppBuilder

export async function deleteOldDeskGapVersion(): Promise<any> {
  // on CircleCi no need to clean manually
  if (process.env.CIRCLECI || !isCi) {
    return
  }

  const cacheDir = getDeskGapCacheDir()
  let files: Array<string>
  try {
    files = await fs.readdir(cacheDir)
  }
  catch (e) {
    if (e.code === "ENOENT") {
      return
    }
    else {
      throw e
    }
  }
  return await Promise.all(files.map(file => {
    if (file.endsWith(".zip") && !file.includes(ELECTRON_VERSION)) {
      console.log(`Remove old deskgap ${file}`)
      return fs.unlink(path.join(cacheDir, file))
    }
    return Promise.resolve(null)
  }))
}

export function downloadAllRequiredDeskGapVersions(): Promise<any> {
  const platforms = process.platform === "win32" ? ["win32"] : ["darwin", "linux", "win32"]
  if (process.platform === "darwin") {
    platforms.push("mas")
  }

  const versions: Array<any> = []
  for (const platform of platforms) {
    const archs = (platform === "mas" || platform === "darwin") ? ["x64"] : (platform === "win32" ? ["ia32", "x64"] : require(`${path.join(__dirname, "../../..")}/packages/builder-util/out/util`).getArchCliNames())
    for (const arch of archs) {
      versions.push({
        version: ELECTRON_VERSION,
        arch,
        platform,
      })
    }
  }
  return executeAppBuilder(["download-deskgap", "--configuration", JSON.stringify(versions)])
}

if (process.mainModule === module) {
  downloadAllRequiredDeskGapVersions()
    .catch(error => {
      console.error((error.stack || error).toString())
      process.exitCode = -1
    })
}