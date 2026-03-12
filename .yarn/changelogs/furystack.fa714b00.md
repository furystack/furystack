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

## 🐛 Bug Fixes
- Switched root ESLint config from `tseslint.config()` to `defineConfig()` from `eslint/config` for proper type inference with the updated `@furystack/eslint-plugin` types (2026‑03‑11 patch).

## ⬆️ Dependencies
- Bumped `@furystack/shades` and `@furystack/shades-common-components`; updated `@furystack/core` dependency to the new major version (2026‑03‑10 release).

## ✨ Features
- Integrated `@furystack/eslint-plugin` into the monorepo ESLint configuration with `recommendedStrict` for all packages and `shadesStrict` for Shades-related packages (2026‑03‑06 release).


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
