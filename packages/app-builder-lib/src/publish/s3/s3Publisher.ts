import { InvalidConfigurationError, log } from "builder-util"
import { S3Options } from "builder-util-runtime"
import { PublishContext } from "deskgap-publish"
import { BaseS3Publisher } from "./BaseS3Publisher"

export default class S3Publisher extends BaseS3Publisher {
  static async checkAndResolveOptions(
    options: S3Options,
    channelFromAppVersion: string | null,
    errorIfCannot: boolean,
  ) {
    const { bucket } = options
    if (bucket == null) throw new InvalidConfigurationError(`Please specify "bucket" for "s3" publish provider`)

    if (options.endpoint == null && bucket.includes(".") && options.region == null)
      // on dotted bucket names, we need to use a path-based endpoint URL. Path-based endpoint URLs need to include the region.
      try {
        // options.region = await executeAppBuilder(["get-bucket-location", "--bucket", bucket])
      } catch (e) {
        if (errorIfCannot) throw e
        else
          log.warn(
            `cannot compute region for bucket (required because on dotted bucket names, we need to use a path-based endpoint URL): ${e}`,
          )
      }

    if (options.channel == null && channelFromAppVersion != null) options.channel = channelFromAppVersion

    if (options.endpoint?.endsWith("/")) {
      ;(options as any).endpoint = options.endpoint.slice(0, -1)
    }
  }

  readonly providerName = "S3"

  constructor(context: PublishContext, private readonly info: S3Options) {
    super(context, info)
  }

  toString() {
    const result = super.toString()
    const { endpoint } = this.info
    if (endpoint != null) return `${result.substring(0, result.length - 1)}, endpoint: ${endpoint})`

    return result
  }

  protected configureS3Options(args: string[]): void {
    super.configureS3Options(args)

    if (this.info.endpoint != null) args.push("--endpoint", this.info.endpoint)

    if (this.info.region != null) args.push("--region", this.info.region)

    if (this.info.storageClass != null) args.push("--storageClass", this.info.storageClass)

    if (this.info.encryption != null) args.push("--encryption", this.info.encryption)
  }

  protected getBucketName(): string {
    return this.info.bucket
  }
}
