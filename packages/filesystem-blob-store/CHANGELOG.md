# Changelog

## [1.0.0] - 2026-06-05

### 💥 Breaking Changes

### First public release — initial stable API surface

First public release of `@furystack/filesystem-blob-store`, published as a major to establish the package's stable, SemVer-governed public API. There is no prior published version to migrate from; everything documented below under **Features** is part of this initial surface.

**Impact:** New consumers only — there is no migration path because no earlier version was published.

### ✨ Features

### Initial release — filesystem adapter for `@furystack/blob-store`

Filesystem-backed `BlobStore` adapter. Each blob is written to `<root>/<key>` literally so `list(prefix)` walks the directory tree naturally, with metadata persisted in a sibling `.meta.json` sidecar.

```typescript
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

The adapter advertises `crossNodeAccessible: false`, so the task runner's boot-time capability cross-check refuses pairing it with a multi-node queue. Use `@furystack/s3-blob-store` for multi-pod deployments.

### Stateless signed upload/download URLs

`getUploadUrl` / `getDownloadUrl` return HMAC-SHA256 signed tokens derived from a configured `secret` (≥32 characters/bytes). Tokens are stateless, so URLs survive process restarts as long as the same secret is configured.

### Server-side blob endpoints

The `@furystack/filesystem-blob-store/endpoints` subpath mounts the matching HTTP routes via `useFileSystemBlobStoreEndpoints`, making the signed URLs work end-to-end: `GET /blobs/<token>` streams a download and `PUT /blobs/<token>` writes a body to the encoded key. Mismatched methods, expired tokens, and oversized uploads return discriminated `{ code, message }` JSON errors with HTTP statuses mapped from `BlobStoreErrorCode` (`signature-invalid` → 403, `not-found` → 404, `too-large` → 413).

```typescript
import { useFileSystemBlobStoreEndpoints } from '@furystack/filesystem-blob-store/endpoints'

await useFileSystemBlobStoreEndpoints({
  injector,
  port: 8080,
  baseUrl: '/blobs',
  root: './data/blobs',
  secret: process.env.BLOB_STORE_SECRET!,
})
```
