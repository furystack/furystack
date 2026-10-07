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

- Added dependency listing to changelogs, allowing users to see updated dependencies in their release notes.

## 📚 Documentation

- Updated agent documentation, including domain models, issue tracking, and triage labels.
- Added detailed specifications for the dependency listing feature.

## ⚡ Performance

- Implemented caching for dependency listing to reduce computation time.

## ♻️ Refactoring

- Refactored `changelogFormatter` for better maintainability and updated internal types.

## 🧪 Tests

- Added comprehensive test suites for dependency diffing and changelog formatting.

## 📦 Build

- Updated the build bundle for the `@yarnpkg/plugin-changelog` dependency.

## 🔧 Chores

- Updated `.opencode` agents and rules for improved agent behavior.
