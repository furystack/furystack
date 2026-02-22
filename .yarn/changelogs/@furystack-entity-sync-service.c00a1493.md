<!-- version-type: major -->

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

## 💥 Breaking Changes

### Collection subscriptions now send full snapshots instead of incremental diffs

The `SubscriptionManager` no longer sends individual `entity-added`/`entity-updated`/`entity-removed` messages for collection subscription changes. Instead, it sends a single `collection-snapshot` message containing the full entries array and total count whenever a collection's data or count changes. This ensures the client always receives a consistent view of entries and count together.

The `collection-count-updated` message type has been removed. See `@furystack/entity-sync` changelog for protocol-level details.

## ✨ Features

### Server-side total count tracking for collection subscriptions

The `SubscriptionManager` computes and delivers the total count of entities matching a collection filter (ignoring `top`/`skip` pagination).

- Initial `snapshot` responses include a `totalCount` field
- When entities change and the collection is re-evaluated, the server sends a `collection-snapshot` with updated entries and count
- Count queries run in parallel with data queries via `Promise.all` to minimize latency

## 🧪 Tests

- Added tests verifying that `totalCount` is included in initial snapshot responses
- Updated collection change notification tests to verify `collection-snapshot` messages
- Tests verify that redundant snapshots are suppressed when nothing changed

## 📚 Documentation

## ⚡ Performance

## ♻️ Refactoring

## 🐛 Bug Fixes

## 📦 Build

## 👷 CI

## ⬆️ Dependencies

## 🗑️ Deprecated

## 🔧 Chores
