<!-- version-type: minor -->

# @furystack/eslint-plugin

## ✨ Features

- Added `require-tabindex-with-spatial-nav-target` rule — reports elements with `data-spatial-nav-target` that are missing `tabIndex`, which is required for `SpatialNavigationService` to focus them. Supports JSX attributes and `useHostProps()` calls (including spread and conditional patterns). Natively focusable elements (`button`, `input`, `select`, `textarea`, `a`) are excluded.
- Added `require-tabindex-with-spatial-nav-target` to the `shades` (warn) and `shadesStrict` (error) preset configs

## 🧪 Tests

- Added tests for `require-tabindex-with-spatial-nav-target` covering JSX elements, `useHostProps()` calls, natively focusable elements, spread patterns, and conditional expressions
