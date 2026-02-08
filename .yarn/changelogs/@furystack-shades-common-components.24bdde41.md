<!-- version-type: major -->

# @furystack/shades-common-components

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

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback. All components have been migrated to use `useDisposable()` inside `render` for one-time setup and cleanup.

## ♻️ Refactoring

- Migrated `Dropdown` keyboard event handler from `constructed` to `useDisposable()` in `render`
- Migrated `Checkbox`, `Input`, `InputNumber`, `Select`, `Switch`, `Slider`, `Autocomplete`, `Radio`, and `RadioGroup` form service registration from `constructed` to `useDisposable()` in `render`
- Migrated `NotyComponent` enter animation from `constructed` to `useDisposable()` in `render`
- Migrated `ButtonGroup`, `AppBar`, `CircularProgress`, `ContextMenu`, `ContextMenuItem`, `DataGrid`, `LinearProgress`, `List`, and `Tree` initialization logic from `constructed` to `useDisposable()` in `render`

## 🧪 Tests

- Updated component tests to align with the removal of `constructed` callback
