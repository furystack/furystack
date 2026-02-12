<!-- version-type: minor -->

# @furystack/entity-sync-service

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

### New package: server-side entity synchronization

Initial release of `@furystack/entity-sync-service`, providing server-side change tracking and WebSocket push for entity synchronization.

Core features:

- **`SubscriptionManager`** — singleton service that tracks per-model changelogs with sequence numbers, manages entity and collection subscriptions, and dispatches incremental updates to connected WebSocket clients
- **`useEntitySync`** — helper function to register models for synchronization after Repository and DataSets are configured
- **`SyncSubscribeAction`** / **`SyncUnsubscribeAction`** — WebSocket actions compatible with `@furystack/websocket-api`
- **Delta sync** — maintains a per-model changelog for sending only changes since client's `lastSeq`
- **Debounced notifications** — configurable debounce window for batching rapid changes before re-evaluating collection subscriptions
- **Query caching** — optional TTL-based caching for `find()` results on collection subscriptions

## ⬆️ Dependencies

- Added `@furystack/core` (workspace:^)
- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/repository` (workspace:^)
- Added `@furystack/websocket-api` (workspace:^)
- Added `ws` ^8.19.0
