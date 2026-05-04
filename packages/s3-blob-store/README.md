# @furystack/s3-blob-store

S3-compatible adapter for `@furystack/blob-store`. Targets AWS S3,
MinIO, Cloudflare R2, Backblaze B2, and any backend that speaks the v3
S3 API. v1 uses single-part `PutObject` for uploads (5 GiB cap on AWS
S3). Apps with very-large blobs that need resumable multipart can
compose `@aws-sdk/lib-storage`'s `Upload` themselves on the underlying
client; v1.x will lift this into a multipart-aware `put` variant.
Presigned URLs ride on `@aws-sdk/s3-request-presigner`.

## Installation

```bash
yarn add @furystack/s3-blob-store
```

The adapter has hard dependencies on the matching `@aws-sdk/*` v3
packages — they are listed as regular dependencies, not peers, so they
install transitively.

## Usage

The caller owns the `S3Client` lifecycle; the adapter never closes it.

```ts
import { S3Client } from '@aws-sdk/client-s3'
import { BlobStore } from '@furystack/blob-store'
import { defineS3BlobStore } from '@furystack/s3-blob-store'

const client = new S3Client({
  region: 'eu-central-1',
  credentials: { accessKeyId, secretAccessKey },
})

injector.bind(
  BlobStore,
  defineS3BlobStore({
    client,
    bucket: 'my-app-blobs',
    keyPrefix: 'tenant-a/',
  }),
)
```

### Lifecycle management

By default, on first `put`, the adapter installs a bucket lifecycle
rule that aborts incomplete multipart uploads after 24h to avoid
runaway storage costs from interrupted clients. Disable with
`manageLifecycle: false` (recommended for buckets the app lacks
`s3:PutLifecycleConfiguration` on). Surface failures via
`onLifecycleError`.

### Capabilities

- `presignedUrls: true`
- `multipart: false` (v1 — single-part `PutObject` only)
- `range: true`
- `crossNodeAccessible: true`
- `maxObjectBytes: 5 GiB` (AWS S3 single-part cap)

### Integration tests

The package ships unit tests against a stubbed `S3Client` and
integration tests gated on `MINIO_URL`. Run locally via:

```bash
docker compose -f packages/s3-blob-store/docker-compose.yml up -d
MINIO_URL=http://127.0.0.1:9000 yarn vitest run --project Service packages/s3-blob-store
```
