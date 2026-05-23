# @furystack/filesystem-blob-store

Filesystem-backed adapter for `@furystack/blob-store`. Stores each blob
at `<root>/<key>` literally so `list(prefix)` walks the directory tree
naturally, with metadata persisted in a sibling `.meta.json` sidecar.

For multi-pod deployments, use `@furystack/s3-blob-store` instead — the
filesystem adapter advertises `crossNodeAccessible: false` so the
boot-time capability cross-check refuses Redis/SQS queue pairings.

## Installation

```bash
yarn add @furystack/filesystem-blob-store
```

## Usage

```ts
import { BlobStore } from '@furystack/blob-store'
import { defineFileSystemBlobStore } from '@furystack/filesystem-blob-store'

injector.bind(
  BlobStore,
  defineFileSystemBlobStore({
    root: './data/blobs',
    secret: process.env.BLOB_STORE_SECRET!,
    publicUrlBase: 'https://api.example.com/blobs',
  }),
)
```

The `secret` (≥32 characters / bytes) is used to sign upload/download
URLs returned by `getDownloadUrl` / `getUploadUrl`. Tokens are
stateless HMAC-SHA256, so URLs survive process restarts as long as the
same secret is configured.

### REST endpoints

Mount the matching server-side endpoints to make the signed URLs
actually work end-to-end:

```ts
import { useFileSystemBlobStoreEndpoints } from '@furystack/filesystem-blob-store/endpoints'

await useFileSystemBlobStoreEndpoints({
  injector,
  port: 8080,
  baseUrl: '/blobs',
  root: './data/blobs',
  secret: process.env.BLOB_STORE_SECRET!,
})
```

`GET /blobs/<token>` streams a download; `PUT /blobs/<token>` accepts
a body and writes it to the encoded key. Mismatched methods, expired
tokens, or oversized uploads return discriminated `{ code, message }`
JSON errors with status codes mapped from `BlobStoreErrorCode`
(`signature-invalid` → 403, `not-found` → 404, `too-large` → 413).
