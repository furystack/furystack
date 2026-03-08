<!-- version-type: minor -->

# @furystack/shades-common-components

## ✨ Features

- Added `navSection` prop to `DataGrid` — sets a `data-nav-section` attribute on the grid wrapper so `SpatialNavigationService` constrains arrow-key navigation within the grid (defaults to `'data-grid'`)
- Added `trapFocus` and `navSection` props to `Modal` — when `trapFocus` is true, spatial navigation is locked within the modal's bounds until it closes
- Added `trapFocus` and `navSection` props to `Dialog` — forwarded to the underlying `Modal` component
- Added `focusOutline` to the `ActionColors` theme type and `cssVariableTheme` — provides a dedicated CSS variable (`--shades-theme-action-focus-outline`) for keyboard/spatial focus indicators
- Added `injectFocusVisibleStyles()` helper that injects global `:focus-visible` / `:focus:not(:focus-visible)` styles using the theme's `focusOutline` variable
- Added `focusOutline` values to all built-in themes
- Added focus coordination to `DataGrid` and `List` — `focusin`/`focusout` DOM events now sync `hasFocus` and auto-select the first entry when the component receives focus

## 🐛 Bug Fixes

- Fixed `CollectionService` and `ListService` `ArrowUp`/`ArrowDown` handlers to only call `preventDefault()` when actually moving focus within the list, allowing spatial navigation to handle cross-boundary movement when the cursor is already at the first or last item
- Added `outline: 'none'` to `AccordionItem` and `Checkbox` `:focus-visible` styles to prevent double focus rings when using the global `focusOutline`

## 🧪 Tests

- Added tests for `DataGrid` focus coordination and `navSection` attribute
- Added tests for `List` focus coordination behavior
- Added tests for `Modal` `trapFocus` and `navSection` behavior
- Extended `CollectionService` tests to verify `ArrowUp`/`ArrowDown` boundary behavior (no `preventDefault` at edges)
- Extended `ListService` tests to verify `ArrowUp`/`ArrowDown` boundary behavior
