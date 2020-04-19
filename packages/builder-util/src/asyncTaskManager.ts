import { CancellationToken } from "builder-util-runtime";
import { log } from "./log";
import { NestedError } from "./promise";

export class AsyncTaskManager {
  readonly tasks: Promise<any>[] = [];
  private readonly errors: Error[] = [];

  constructor(private readonly cancellationToken: CancellationToken) {}

  add(task: () => Promise<any>) {
    if (this.cancellationToken == null || !this.cancellationToken.cancelled) this.addTask(task());
  }

  addTask(promise: Promise<any>) {
    if (this.cancellationToken.cancelled) {
      log.debug({ reason: "cancelled", stack: new Error().stack }, "async task not added");
      if ("cancel" in promise) (promise as any).cancel();

      return;
    }

    this.tasks.push(
      promise.catch((it) => {
        log.debug({ error: it.message || it.toString() }, "async task error");
        this.errors.push(it);
        return Promise.resolve(null);
      }),
    );
  }

  async awaitTasks(): Promise<any[]> {
    if (this.cancellationToken.cancelled) {
      this.cancelTasks();
      return [];
    }

    const checkErrors = () => {
      if (this.errors.length > 0) {
        this.cancelTasks();
        throwError(this.errors);
        return;
      }
    };

    checkErrors();

    let result: any[] | null = null;
    const { tasks } = this;
    let list = tasks.slice();
    tasks.length = 0;
    while (list.length > 0) {
      const subResult = await Promise.all(list);
      result = result == null ? subResult : result.concat(subResult);
      checkErrors();
      if (tasks.length === 0) break;
      else {
        if (this.cancellationToken.cancelled) {
          this.cancelTasks();
          return [];
        }

        list = tasks.slice();
        tasks.length = 0;
      }
    }
    return result || [];
  }

  cancelTasks() {
    for (const task of this.tasks) if ("cancel" in task) (task as any).cancel();

    this.tasks.length = 0;
  }
}

function throwError(errors: Error[]) {
  if (errors.length === 1) throw errors[0];
  else if (errors.length > 1) throw new NestedError(errors, "Cannot cleanup: ");
}
