<!-- version-type: major -->

# @furystack/shades-showcase-app

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

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback from the Shade API.

## ♻️ Refactoring

- Migrated `MonacoEditor` component from `constructed` to `useDisposable()` in `render` for editor initialization and cleanup
- Migrated `Navigate` component from `constructed` to `useDisposable()` in `render` for location observer setup
- Migrated `ProgressPage` and `HomeWizard` components from `constructed` to `useDisposable()` in `render`
