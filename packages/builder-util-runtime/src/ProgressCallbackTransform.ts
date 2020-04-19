/* eslint-disable @typescript-eslint/tslint/config */
// tslint:disable: member-ordering
import { Transform } from "stream";
import { CancellationToken } from "./CancellationToken";

export interface ProgressInfo {
  bytesPerSecond: number;
  delta: number;
  percent: number;
  total: number;
  transferred: number;
}

export class ProgressCallbackTransform extends Transform {
  private delta = 0;

  private readonly start = Date.now();
  private nextUpdate = this.start + 1000;
  private transferred = 0;

  constructor(
    private readonly total: number,
    private readonly cancellationToken: CancellationToken,
    private readonly onProgress: (info: ProgressInfo) => any,
  ) {
    super();
  }

  _flush(callback: any): void {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"));
      return;
    }

    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1000)),
    });
    this.delta = 0;

    callback(null);
  }

  _transform(chunk: any, encoding: string, callback: any) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"), null);
      return;
    }

    this.transferred += chunk.length;
    this.delta += chunk.length;

    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.total /* will be emitted on _flush */) {
      this.nextUpdate = now + 1000;

      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: (this.transferred / this.total) * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1000)),
      });
      this.delta = 0;
    }

    callback(null, chunk);
  }
}
