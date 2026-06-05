# Changelog

## [1.0.0] - 2026-06-05

### 💥 Breaking Changes

### First public release — initial stable API surface

First public release of `@furystack/blob-store`, published as a major to establish the package's stable, SemVer-governed public API. There is no prior published version to migrate from; everything documented below under **Features** is part of this initial surface.

**Impact:** New consumers only — there is no migration path because no earlier version was published.

### ✨ Features

### Initial release — transport-agnostic blob storage primitive

First publishable revision of the blob storage abstraction used by `@furystack/task-runner`. Stores and retrieves large binaries by string key, independent of the backing transport.

- `BlobStore` token — the DI surface for `put` / `get` / `getMetadata` / `list` / `remove` / `getUploadUrl` / `getDownloadUrl`. The default factory throws `BlobStoreNotConfiguredError`, so apps must bind a concrete adapter before resolving it.
- `InMemoryBlobStore` — zero-dependency adapter for tests and single-node dev, bound directly without configuration.
- `BlobStoreCapabilities` matrix (`presignedUrls`, `multipart`, `range`, `crossNodeAccessible`) so consumers can refuse incompatible deployment shapes at boot — e.g. pairing a multi-node queue with a single-node-only blob store.
- `BlobStoreError` with a `code` discriminator (`'not-found'`, `'capability-missing'`, `'too-large'`, `'invalid-key'`, `'invalid-config'`, `'conflict'`, `'io-error'`) for branching without message substring matching.
- `validateBlobKey` / `MAX_BLOB_KEY_LENGTH` for key validation, and `normalizeBlobPutInput` / `collectBlobStream` helpers for adapter authors.

```typescript
import { createInjector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'

await using injector = createInjector()
injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'tests' }))

const store = injector.get(BlobStore)
const ref = await store.put('greeting.txt', Buffer.from('hello'))
const { stream, contentLength } = await store.get(ref.key)
```

Concrete production adapters ship in their own packages: `@furystack/filesystem-blob-store` and `@furystack/s3-blob-store`.
