<!-- version-type: major -->

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

## 💥 Breaking Changes

### `useCollectionSync` now returns `SyncState<{ entries: T[]; count: number }>` directly

The `useCollectionSync` hook return type changed from `{ state: SyncState<T[]>; totalCount: number | undefined }` to `SyncState<{ entries: T[]; count: number }>`. Entries and count are now part of the same sync state, ensuring they are always consistent.

**Examples:**

```typescript
// ❌ Before
const { state, totalCount } = useCollectionSync(options, ChatMessage, { filter })

if (state.status === 'synced') {
  console.log(state.data) // T[]
  console.log(`Total: ${totalCount}`)
}

// ✅ After
const messagesState = useCollectionSync(options, ChatMessage, { filter })

if (messagesState.status === 'synced') {
  console.log(messagesState.data.entries) // T[]
  console.log(`Total: ${messagesState.data.count}`)
}
```

**Impact:** All callers of `useCollectionSync` need to update. The return value is now a `SyncState` directly, with `data.entries` and `data.count` replacing the previous `state.data` and `totalCount`.

### `LiveCollection<T>` state type changed to `SyncState<{ entries: T[]; count: number }>`

The `LiveCollection<T>.state` observable type changed from `SyncState<T[]>` to `SyncState<{ entries: T[]; count: number }>`. The separate `totalCount` observable has been removed. Any code that manually constructs or reads `LiveCollection` must be updated.

## ✨ Features

### Unified collection sync state with entries and count

Collection subscriptions now deliver entries and count as a single atomic state update, ensuring they are always consistent. The count is no longer a separate observable that could be out of sync with the entries.

- `LiveCollection<T>.state` contains `{ entries: T[]; count: number }` in its data
- `useCollectionSync` returns a single `SyncState` with unified data
- The client handles the new `collection-snapshot` server message for live re-syncs

## 🧪 Tests

- Updated tests for unified collection state shape (`data.entries` / `data.count`)
- Updated `useCollectionSync` hook tests for the new return type
- Added tests verifying count is included in synced and cached states

## 📚 Documentation

## ⚡ Performance

## ♻️ Refactoring

## 🐛 Bug Fixes

## 📦 Build

## 👷 CI

## ⬆️ Dependencies

## 🗑️ Deprecated

## 🔧 Chores
