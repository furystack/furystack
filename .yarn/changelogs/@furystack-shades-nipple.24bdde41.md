<!-- version-type: major -->

# @furystack/shades-nipple

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

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback.

## ♻️ Refactoring

- Migrated `NippleComponent` from async `constructed` callback to `useDisposable()` in `render` for nipplejs manager initialization and cleanup
