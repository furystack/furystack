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

- Updated the Nipple integration surface across the workspace to use a normalized single-event callback payload with joystick data available under `event.data`.

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

- Refreshed joystick integration documentation examples to reflect the current callback signature and payload access pattern.

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Updated Nipple component callback mocks to use explicit event handler typing, keeping tests aligned with the exported API.

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

- Upgraded `nipplejs` to `^1.0.1` in the Nipple integration package and refreshed lockfile entries.

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
