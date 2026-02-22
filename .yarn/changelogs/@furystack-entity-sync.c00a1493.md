<!-- version-type: major -->

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

## 💥 Breaking Changes

### Added `collection-snapshot` variant to `ServerSyncMessage`

A new `collection-snapshot` variant has been added to the `ServerSyncMessage` union type. The server now sends a full snapshot (entries + count) whenever a collection changes, instead of individual diff messages. This ensures entries and count are always delivered together as a consistent unit.

Consumers that exhaustively match on `ServerSyncMessage.type` (without a `default`) must add a `collection-snapshot` case.

**Examples:**

```typescript
// ✅ Handle the new collection-snapshot message
switch (message.type) {
  case 'collection-snapshot':
    console.log(message.data, message.totalCount)
    break
  // ... other cases
}
```

**Impact:** Consumers that exhaustively match on `ServerSyncMessage.type` (without a `default`) will get a compile error until the new case is handled.

## ✨ Features

### Total count support for collection sync messages

- Added optional `totalCount` field to `snapshot` and `delta` server messages, reporting the total number of matching entities (ignoring `top`/`skip` pagination)
- Added `collection-snapshot` message type that delivers a full re-sync (entries + count) when a collection changes

## 🧪 Tests

## 📚 Documentation

## ⚡ Performance

## ♻️ Refactoring

## 🐛 Bug Fixes

## 📦 Build

## 👷 CI

## ⬆️ Dependencies

## 🗑️ Deprecated

## 🔧 Chores
