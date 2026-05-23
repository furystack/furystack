import { PutBucketLifecycleConfigurationCommand, type S3Client } from '@aws-sdk/client-s3'

/**
 * Default rule id used when {@link S3BlobStoreOptions.manageLifecycle} is
 * enabled. Stable, greppable, and easy to remove out-of-band via the AWS
 * console / CLI.
 */
export const DEFAULT_LIFECYCLE_RULE_ID = 'furystack-blob-store-abort-incomplete-multipart'

export type EnsureBucketLifecycleOptions = {
  client: S3Client
  bucket: string
  ruleId: string
  /** Invoked when the lifecycle PUT fails (e.g. missing IAM permission). */
  onError?: (error: unknown) => void
}

/**
 * Best-effort bootstrap of the bucket's "abort incomplete multipart" rule.
 * Swallows errors and forwards them to `onError` — apps surface them via
 * their own telemetry / logger sink.
 *
 * Idempotent at the call site: callers track whether the bootstrap has
 * been attempted and only call this helper on first put.
 */
export const ensureBucketLifecycle = async (options: EnsureBucketLifecycleOptions): Promise<void> => {
  const { client, bucket, ruleId, onError } = options
  try {
    await client.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: bucket,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: ruleId,
              Status: 'Enabled',
              Filter: {},
              AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
            },
          ],
        },
      }),
    )
  } catch (error) {
    onError?.(error)
  }
}
