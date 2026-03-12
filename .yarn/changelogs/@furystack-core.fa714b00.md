<!-- version-type: patch -->

# @furystack/core

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

### IdentityContext lifetime changed from `scoped` to `explicit`

`IdentityContext` now uses `@Injectable({ lifetime: 'explicit' })` so child injectors inherit the instance from their parent. Code that previously relied on the default scoped instance may now need to call `injector.setExplicitInstance` before accessing it. See migration notes in the package changelog.

## 📚 Documentation

- Updated `IdentityContext` JSDoc to reflect the new explicit lifetime and parent‑chain inheritance.

## ✨ Features

- Core package bump to 16.0.0 with the breaking change above and other internal refinements.

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
