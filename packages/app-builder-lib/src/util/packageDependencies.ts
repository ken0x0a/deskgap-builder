import { Lazy } from "lazy-val";
import { executeAppBuilderAsJson } from "./appBuilder";

export function createLazyProductionDeps(projectDir: string, excludedDependencies: string[] | null) {
  return new Lazy(async () => {
    const args = ["node-dep-tree", "--dir", projectDir];
    if (excludedDependencies != null) for (const name of excludedDependencies) args.push("--exclude-dep", name);

    return executeAppBuilderAsJson<any[]>(args);
  });
}

export interface NodeModuleDirInfo {
  readonly deps: NodeModuleInfo[];
  readonly dir: string;
}

export interface NodeModuleInfo {
  readonly name: string;
}
