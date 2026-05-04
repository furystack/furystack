# @furystack/blob-store

Transport-agnostic primitive for storing and retrieving large binaries
("blobs") by string key. Provides the `BlobStore` interface, an
in-memory adapter for tests, and the capability matrix the FuryStack
task runner uses to refuse multi-node misconfigurations at boot.
Concrete production adapters ship in their own packages
(`@furystack/filesystem-blob-store`, `@furystack/s3-blob-store`).

See `docs/internal/distributed-task-management.md` for the full design.

## Installation

```bash
npm install @furystack/blob-store
# or
yarn add @furystack/blob-store
```

## Usage

The default factory throws `BlobStoreNotConfiguredError`. Apps must
bind a backing adapter before resolving the token. For tests, bind
`InMemoryBlobStore` directly.

```ts
import { createInjector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'

await using injector = createInjector()
injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'tests' }))

const store = injector.get(BlobStore)
const ref = await store.put('greeting.txt', Buffer.from('hello'))
const { stream, contentLength } = await store.get(ref.key)
```

## Capabilities

Every adapter declares a static `BlobStoreCapabilities` object so
consumers (notably the future `@furystack/task-runner`) can fail loudly
on incompatible deployment shapes — for example, pairing a
multi-node queue with a single-node-only blob store.

| Capability            | In-memory | Filesystem | S3-compatible |
| --------------------- | --------- | ---------- | ------------- |
| `presignedUrls`       | ❌        | ❌\*       | ✅            |
| `multipart`           | ❌        | ❌         | ✅            |
| `range`               | ❌        | ❌         | ✅            |
| `crossNodeAccessible` | ❌        | ❌         | ✅            |

\* Filesystem adapter exposes server-proxy upload/download endpoints
that mimic the presigned-URL flow at the API layer; the capability
flag is `false` because the URL is not transport-direct.

## Errors

All errors thrown by adapters are `BlobStoreError` instances with a
`code` discriminator (`'not-found'`, `'capability-missing'`,
`'too-large'`, `'invalid-key'`, `'invalid-config'`, `'conflict'`,
`'io-error'`). Switch on `.code` to distinguish cases without
substring matching on messages.
