<!-- version-type: major -->

# @furystack/shades-showcase-app

## 💥 Breaking Changes

### Updated for New Shades Rendering Engine

All showcase pages and components have been updated to use the new `useHostProps` and `useRef` APIs, replacing the removed `element` render option.

## ♻️ Refactoring

- Migrated all page components from imperative `element` manipulation to declarative `useHostProps` and `useRef`
- Updated form page with restructured form examples and fieldset usage
- Updated button-group, input-number, radio, slider, switch, and other input pages
- Updated dialog, wizard, menu, dropdown, and tabs navigation pages
- Updated progress feedback page
- Updated Monaco editor component integration
- Updated nipple integration page
- Updated routes component

## 🧪 Tests

- Updated e2e tests for form, grid, list, layout, and wizard pages to accommodate rendering changes
- Updated visual snapshot baselines for form fieldset tests

## ⬆️ Dependencies

- Updated `@furystack/shades` and related packages to new major versions
