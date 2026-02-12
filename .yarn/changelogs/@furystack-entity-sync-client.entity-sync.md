<!-- version-type: minor -->

# @furystack/entity-sync-client

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

### New package: client-side entity synchronization

Initial release of `@furystack/entity-sync-client`, providing real-time, reactive data subscriptions over WebSocket.

Core features:

- **`EntitySyncService`** — manages WebSocket connections, subscriptions, and reconnection
- **`LiveEntity<T>`** / **`LiveCollection<T>`** — reference-counted subscription handles with `ObservableValue<SyncState<T>>` state
- **Auto-reconnect** — exponential backoff with configurable limits
- **Reference counting** — multiple subscribers share the same WebSocket subscription; auto-suspend after configurable delay when all observers detach
- **Delta sync** — sends `lastSeq` on reconnect to receive only incremental changes
- **Local caching** — pluggable `SyncCacheStore` for stale-while-revalidate pattern

### Shades hooks

- **`useEntitySync`** — subscribes to a single entity by primary key, returns reactive `SyncState<T>`
- **`useCollectionSync`** — subscribes to a filtered/ordered collection, returns reactive `SyncState<T[]>`

Both hooks handle subscription lifecycle automatically (subscribe on mount, dispose on unmount).

## ⬆️ Dependencies

- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/utils` (workspace:^)
