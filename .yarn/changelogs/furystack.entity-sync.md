<!-- version-type: patch -->

# furystack

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

- Added `@furystack/entity-sync`, `@furystack/entity-sync-client`, and `@furystack/entity-sync-service` packages for real-time entity synchronization over WebSocket

## 📦 Build

- Added entity-sync packages to TypeScript project references (`packages/tsconfig.json`)
- Added entity-sync test globs to vitest configuration (`vitest.config.mts`)
