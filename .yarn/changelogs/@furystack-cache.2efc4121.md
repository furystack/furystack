<!-- version-type: patch -->

# @furystack/cache

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

<!-- PLACEHOLDER: Describe your shiny new features (feat:) -->

## 🐛 Bug Fixes

- Fixed `obsoleteRange()` throwing `CannotObsoleteUnloadedError` when the cache contains entries in non-loaded states (loading, failed, or uninitialized). Non-loaded entries are now skipped instead of attempting to set them as obsolete.

## 🧪 Tests

- Added tests for `obsoleteRange()` verifying that entries in loading, failed, and uninitialized states are correctly skipped

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
