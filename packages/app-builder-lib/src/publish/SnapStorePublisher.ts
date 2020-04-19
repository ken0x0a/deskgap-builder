import { executeAppBuilder } from "builder-util";
import { PublishConfiguration } from "builder-util-runtime";
import { PublishContext, Publisher, UploadTask } from "deskgap-publish";
import * as path from "path";

export class SnapStorePublisher extends Publisher {
  readonly providerName = "snapStore";

  constructor(context: PublishContext, private readonly options: SnapStoreOptions) {
    super(context);
  }

  toString(): string {
    return "Snap Store";
  }

  upload(task: UploadTask): Promise<any> {
    this.createProgressBar(path.basename(task.file), -1);

    const args = ["publish-snap", "-f", task.file];

    let { channels } = this.options;
    if (channels == null) channels = ["edge"];
    else if (typeof channels === "string") channels = channels.split(",");

    for (const channel of channels) args.push("-c", channel);

    return executeAppBuilder(args);
  }
}

/**
 * [Snap Store](https://snapcraft.io/) options.
 */
export interface SnapStoreOptions extends PublishConfiguration {
  /**
   * The list of channels the snap would be released.
   * @default ["edge"]
   */
  readonly channels?: string | string[] | null;
}
