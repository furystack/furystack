<!-- version-type: patch -->

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

## ✨ Features

### Spatial Navigation Service

- Added `SpatialNavigationService` with section-scoped arrow-key focus movement, cross-section memory, input passthrough, and configurable backspace/escape behaviors.

- Added optional `deps` parameter to `useDisposable()` for automatic resource recreation.

### 💥 Breaking Changes

- `shadowDomName` renamed to `customElementName` for Shade APIs (see migration docs).

## 🐛 Bug Fixes

- Memory leak fixes for `LocationService` and `ScreenService` observables due to missing disposals.

## ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version.

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

<!-- PLACEHOLDER: Describe test changes (test:) -->

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
