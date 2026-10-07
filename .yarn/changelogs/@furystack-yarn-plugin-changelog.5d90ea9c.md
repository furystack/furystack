<!-- version-type: minor -->

# @furystack/yarn-plugin-changelog

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

## 🗑️ Deprecated

<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

- Added dependency listing to changelogs, allowing users to see updated dependencies in their release notes.
- Added caching for dependency listing to improve performance during changelog generation.

## 🐛 Bug Fixes

- Improved dependency listing logic to better handle various dependency types.

## 📚 Documentation

- Added detailed specifications for the dependency listing feature.

## ⚡ Performance

- Implemented caching for dependency listing to reduce computation time.

## ♻️ Refactoring

- Refactored `changelogFormatter` for better maintainability and updated internal types.

## 🧪 Tests

- Added comprehensive test suites for dependency diffing and changelog formatting.

## 📦 Build

- Updated the build bundle for the `@yarnpkg/plugin-changelog` dependency.
