<!-- version-type: minor -->

# @furystack/shades-common-components

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

- Fixed stale drawer state persisting in `LayoutService` after a `Drawer` component is unmounted, which could cause incorrect content margins when navigating between views
- Added `removeDrawer()` method to `LayoutService` to clean up drawer configuration and reset associated CSS variables
- Fixed `AppBar` `backdrop-filter` creating a CSS containing block that broke `position:fixed` descendants (e.g. `Dropdown` overlays); moved the effect to a `::before` pseudo-element

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

- Simplified `CommandPaletteInput` by removing width animation; component is now always full-width with focus/clear on open/close
- Changed `Avatar` fallback icon to use percentage-based sizing with an inline SVG instead of the `Icon` component for better scaling at different sizes

## 🧪 Tests

- Added tests for `removeDrawer()` covering left/right removal, isolation between drawers, no-op on missing drawer, and CSS variable reset
- Added test for `initDrawer()` overwriting an existing drawer configuration
- Added integration tests for `Drawer` component disposal cleanup

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
