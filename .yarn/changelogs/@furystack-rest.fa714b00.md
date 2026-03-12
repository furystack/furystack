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

- Added bidirectional OpenAPI 3.1 support (`OpenApiToRestApi`, `openApiToSchema()`, converters, metadata).
- Improved error handling: `decode()` throws `RequestError` on invalid query values and percent-encoding.

## 🐛 Bug Fixes

- `decode()` now throws `RequestError` for malformed base64/JSON/percent‑encoding inputs.

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
