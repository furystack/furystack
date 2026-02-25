<!-- version-type: minor -->

# @furystack/shades-showcase-app

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

### Runtime Theme Switcher

Added a `useTheme()` function exposed on the `window` object for switching between all 14 available themes at runtime. Supports `dark`, `light`, `paladin`, `chieftain`, `neon-runner`, `vault-dweller`, `shadow-broker`, `dragonborn`, `plumber`, `auditore`, `replicant`, `sandworm`, `architect`, and `wild-hunt` themes via lazy-loaded dynamic imports.

## ♻️ Refactoring

- Updated showcase pages to use `Typography` components instead of raw HTML heading/paragraph tags
- Updated layout test pages, input demos, and surface demos to align with the new theme-aware component APIs

## 🧪 Tests

- Updated typography and markdown E2E tests for compatibility with semantic HTML tag rendering
