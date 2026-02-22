<!-- version-type: minor -->

# @furystack/shades

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

### Dependency tracking for `useDisposable`

`useDisposable` now accepts an optional `deps` array parameter. When the serialized deps value changes between renders, the old resource is automatically disposed and a new one is created. This enables resources that depend on dynamic parameters (e.g., entity-sync subscriptions with changing query options) to be re-created without encoding all parameters into the cache key.

**Usage:**

```typescript
const liveEntity = useDisposable('entitySync:MyModel', () => syncService.subscribeEntity(MyModel, currentKey), [
  currentKey,
])
```

## 🧪 Tests

- Added tests for `useDisposable` dependency tracking in `ResourceManager`, covering re-creation on deps change and no-op when deps are unchanged

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
