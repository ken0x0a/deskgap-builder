import { DebugLogger, InvalidConfigurationError } from "builder-util";
import { ParallelsVmManager, parseVmList } from "./ParallelsVm";
import { VmManager } from "./VmManager";

export { VmManager } from "./VmManager";

export async function getWindowsVm(debugLogger: DebugLogger): Promise<VmManager> {
  const vmList = (await parseVmList(debugLogger)).filter((it) => it.os === "win-10");
  if (vmList.length === 0)
    throw new InvalidConfigurationError(
      "Cannot find suitable Parallels Desktop virtual machine (Windows 10 is required)",
    );

  // prefer running or suspended vm
  return new ParallelsVmManager(
    vmList.find((it) => it.state === "running") || vmList.find((it) => it.state === "suspended") || vmList[0],
  );
}
