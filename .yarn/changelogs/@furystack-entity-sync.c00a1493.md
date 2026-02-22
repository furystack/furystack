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

### Replaced `collection-count-updated` with `collection-snapshot` in `ServerSyncMessage`

The `collection-count-updated` variant has been removed from the `ServerSyncMessage` union type and replaced with `collection-snapshot`. The server now sends a full snapshot (entries + count) whenever a collection changes, instead of individual diff messages plus a separate count update. This ensures entries and count are always delivered together as a consistent unit.

Any code that performs exhaustive pattern matching on `ServerSyncMessage.type` must handle `collection-snapshot` and remove the `collection-count-updated` case.

**Examples:**

```typescript
// ❌ Before — handled collection-count-updated
switch (message.type) {
  case 'collection-count-updated':
    console.log(message.totalCount)
    break
  // ... other cases
}

// ✅ After — handle collection-snapshot
switch (message.type) {
  case 'collection-snapshot':
    console.log(message.data, message.totalCount)
    break
  // ... other cases
}
```

**Impact:** Any consumer that matches on `ServerSyncMessage.type` will get a compile error until the new case is handled.

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
