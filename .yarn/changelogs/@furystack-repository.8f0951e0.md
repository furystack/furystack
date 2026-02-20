<!-- version-type: minor -->

# @furystack/repository

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

## 🗑️ Deprecated

<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

### Bulk Remove in DataSet

`DataSet.remove()` now accepts multiple primary keys via rest parameters, allowing removal of several entities in a single call. Authorization checks run against all entities before any are deleted (all-or-nothing), and an `onEntityRemoved` event is emitted for each removed entity.

**Usage:**

```typescript
// Before - remove one at a time
await dataSet.remove(injector, key1)
await dataSet.remove(injector, key2)

// After - remove multiple at once
await dataSet.remove(injector, key1, key2, key3)
```

## 🐛 Bug Fixes

- Fixed `DataSet.get()` to fetch the full entity before running `authorizeGetEntity`, then applying field selection afterward. Previously, the entity passed to the authorization callback could have missing fields when `select` was provided.

## ♻️ Refactoring

- `DataSet.get()` return type is now properly generic as `PartialResult<T, TSelect>`, improving type inference for callers that pass a `select` parameter

## 🧪 Tests

- Added tests for bulk removal: removing multiple entities, event emission per key, per-entity authorization, and all-or-nothing rollback when authorization fails

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
