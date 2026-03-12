<!-- version-type: patch -->
# @furystack/eslint-plugin

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
- Replaced `TSESLint.FlatConfig.Config` with native `Linter.Config` from `eslint` in `recommended` and `shades` configs to fix type compatibility with `eslint/config`.
- Added type assertion on the default plugin export to work around a typescript-eslint typing issue that prevented proper inference.

## ✨ Features
- Version bump and existing rule enhancements.


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
