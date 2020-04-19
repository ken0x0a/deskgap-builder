export interface ToolInfo {
  env?: any;
  path: string;
}

export function computeEnv(oldValue: string | null | undefined, newValues: string[]): string {
  const parsedOldValue = oldValue ? oldValue.split(":") : [];
  return newValues
    .concat(parsedOldValue)
    .filter((it) => it.length > 0)
    .join(":");
}

export function computeToolEnv(libPath: string[]): any {
  // noinspection SpellCheckingInspection
  return {
    ...process.env,
    DYLD_LIBRARY_PATH: computeEnv(process.env.DYLD_LIBRARY_PATH, libPath),
  };
}
