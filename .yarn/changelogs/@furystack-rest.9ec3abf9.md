<!-- version-type: patch -->

# @furystack/rest

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

- `decode()` now throws a `RequestError` with status 400 when query parameter values contain invalid base64, invalid percent-encoding, or invalid JSON, instead of letting raw errors propagate

## 🧪 Tests

- Added unit tests for `decode()` error handling covering invalid base64, invalid percent-encoding, and invalid JSON inputs
- Added test for `deserializeQueryString()` rejecting malformed query parameter values

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
