<!-- version-type: patch -->

# @furystack/inject

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

### Fixed singleton injector reference being overwritten by child injectors

The `getInstance()` method was unconditionally overwriting the injector reference on returned instances, even for singletons retrieved from a parent injector. This caused singletons to incorrectly reference the child injector that last retrieved them instead of the parent injector that created/owns them.

**Before:** When a child injector retrieved a singleton from a parent, the singleton's `injector` property was overwritten to point to the child.

**After:** The injector reference is now set at instance creation time and preserved when retrieved from parent injectors.

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Added regression tests to verify singleton injector references are preserved when retrieved from child injectors

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
