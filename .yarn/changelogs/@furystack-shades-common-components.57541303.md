<!-- version-type: major -->

# @furystack/shades-common-components

## ✨ Features

- Added `navSection` prop to `DataGrid` — sets a `data-nav-section` attribute on the grid wrapper so `SpatialNavigationService` constrains arrow-key navigation within the grid (auto-generated per instance when not provided, e.g. `data-grid-0`)
- Added `trapFocus` and `navSection` props to `Modal` — when `trapFocus` is true, spatial navigation is locked within the modal's bounds until it closes
- Added `trapFocus` (defaults to `true`) and `navSection` props to `Dialog` — forwarded to the underlying `Modal` component
- Added `focusOutline` to the `ActionColors` theme type and `cssVariableTheme` — provides a dedicated CSS variable (`--shades-theme-action-focus-outline`) for keyboard/spatial focus indicators
- Added `injectFocusVisibleStyles()` helper that injects global `:focus-visible` / `:focus:not(:focus-visible)` styles using the theme's `focusOutline` variable
- Added `focusOutline` values to all built-in themes
- Added focus coordination to `DataGrid`, `List`, and `Tree` — `focusin`/`focusout` DOM events now sync `hasFocus` and `focusedEntry`/`focusedItem` state, replacing previous click-based focus management

## 💥 Breaking Changes

- Removed `ArrowUp`/`ArrowDown` handlers from `CollectionService` and `ListService` — arrow-key navigation is now delegated to `SpatialNavigationService`
- Removed `Tab` handler from `CollectionService` and `ListService` — focus management now uses native `focusin`/`focusout`
- `TreeService` `ArrowRight` on an expanded node no longer focuses the first child — delegated to spatial navigation
- `ActionColors` type now requires a `focusOutline` property — all custom themes must include this value

### 🔄 Migration Guide

Custom themes must add `focusOutline` to the `action` object:

```typescript
// Before
action: {
  hoverBackground: '...',
  focusRing: '0 0 0 3px ...',
}

// After
action: {
  hoverBackground: '...',
  focusRing: '0 0 0 3px ...',
  focusOutline: '2px solid #3f51b5', // your theme's accent color
}
```

## 🐛 Bug Fixes

- Added `outline: 'none'` to `AccordionItem`, `Checkbox`, `Radio`, `Slider`, and `Switch` `:focus-visible` styles to prevent double focus rings when using the global `focusOutline`

## 🧪 Tests

- Added tests for `DataGrid` focus coordination and `navSection` attribute
- Added tests for `List` focus coordination behavior
- Added tests for `Modal` `trapFocus` and `navSection` behavior
- Updated `CollectionService`, `ListService`, and `TreeService` tests to verify arrow keys are no longer handled
