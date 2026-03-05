<!-- version-type: minor -->

# @furystack/shades-common-components

## ✨ Features

- Added `viewTransition` prop to `Tabs` — animates tab panel switches via the View Transition API when the active tab changes
- Added `viewTransition` prop to `Wizard` — animates step transitions (next/prev) via the View Transition API
- Added `viewTransition` prop to `CacheView` — animates state category changes (loading → value, value → error, etc.) via the View Transition API

## 🧪 Tests

- Added tests for `Tabs` verifying `startViewTransition` is called on tab switch when enabled and skipped when not set
- Added tests for `Wizard` verifying `startViewTransition` is called on next/prev navigation when enabled and skipped when not set
- Added tests for `CacheView` verifying `startViewTransition` is called on state category changes when enabled and skipped when not set

## ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency
