<!-- version-type: minor -->

# @furystack/entity-sync

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

### New package: shared protocol types for entity synchronization

Initial release of `@furystack/entity-sync`, providing the TypeScript types for the WebSocket-based entity synchronization protocol used between `@furystack/entity-sync-client` and `@furystack/entity-sync-service`.

Key types:

- `SyncVersion` — sequence number and timestamp metadata for change ordering
- `SyncChangeEntry` — discriminated union for added/updated/removed entity changes
- `ClientSyncMessage` — messages from client to server (subscribe-entity, subscribe-collection, unsubscribe)
- `ServerSyncMessage` — messages from server to client (subscribed snapshot/delta, incremental changes, errors)
- `SyncState<T>` — client-side discriminated union for subscription state (connecting, cached, suspended, synced, error)

## ⬆️ Dependencies

- Added `@furystack/core` (workspace:^) as a dependency
