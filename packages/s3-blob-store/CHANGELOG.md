# Changelog

## [1.0.1] - 2026-08-26

### ⬆️ Dependencies

- Updated `@aws-sdk/client-s3` to `^3.1090.0`
- Updated `@aws-sdk/s3-request-presigner` to `^3.1090.0`
- Updated dependencies
- Bumped `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to `^3.1085.0` and raised dev `typescript` to `^7.0.2`, `@types/node` to `^26.1.1`, and `vitest` to `^4.1.10`. No source changes — dependency bump only.

## [1.0.0] - 2026-06-05

### 💥 Breaking Changes

### First public release — initial stable API surface

First public release of `@furystack/s3-blob-store`, published as a major to establish the package's stable, SemVer-governed public API. There is no prior published version to migrate from; everything documented below under **Features** is part of this initial surface.

**Impact:** New consumers only — there is no migration path because no earlier version was published.

### ✨ Features

### Initial release — S3-compatible adapter for `@furystack/blob-store`

S3-compatible `BlobStore` adapter targeting AWS S3, MinIO, Cloudflare R2, Backblaze B2, and any backend that speaks the v3 S3 API. The caller owns the `S3Client` lifecycle; the adapter never closes it.

```typescript
import { S3Client } from '@aws-sdk/client-s3'
import { BlobStore } from '@furystack/blob-store'
import { defineS3BlobStore } from '@furystack/s3-blob-store'

const client = new S3Client({ region: 'eu-central-1', credentials: { accessKeyId, secretAccessKey } })

injector.bind(BlobStore, defineS3BlobStore({ client, bucket: 'my-app-blobs', keyPrefix: 'tenant-a/' }))
```

Capabilities: `presignedUrls: true`, `range: true`, `crossNodeAccessible: true`, `multipart: false`, `maxObjectBytes: 5 GiB`. v1 uploads use single-part `PutObject`; apps needing resumable multipart can compose `@aws-sdk/lib-storage`'s `Upload` on the underlying client and pass the resulting key back as a `BlobRef`. Presigned URLs ride on `@aws-sdk/s3-request-presigner`.

### Automatic incomplete-multipart lifecycle rule

On first `put`, the adapter installs a bucket lifecycle rule that aborts incomplete multipart uploads after 24h to avoid runaway storage costs from interrupted clients. Disable with `manageLifecycle: false` (recommended for buckets the app lacks `s3:PutLifecycleConfiguration` on) and surface failures via `onLifecycleError`.

### 🧪 Tests

- Unit suite against a stubbed `S3Client` verifying command shapes and error mapping.
- Integration suite gated on a reachable S3-compatible endpoint (the repo's `docker-compose.yml` exposes MinIO on `http://localhost:9000`). Endpoint and credentials override via `MINIO_URL` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`.
