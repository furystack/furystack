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

## 🗑️ Deprecated

<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

- `useEntitySync` now uses a stable hook key based on the model name and passes the entity key as a dependency to `useDisposable`. The subscription is automatically re-created when the key changes, instead of requiring a new hook key per entity key.
- `useCollectionSync` now uses `deps` for `top`, `skip`, and `order` options, keeping only the `filter` in the hook key. This allows the subscription to be re-created when pagination or ordering changes without creating a brand new cache entry.

## 🧪 Tests

- Added tests for `useEntitySync` covering subscription creation and re-creation on key change
- Added tests for `useCollectionSync` covering subscription creation, re-creation on option changes, and filter-based key partitioning

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
