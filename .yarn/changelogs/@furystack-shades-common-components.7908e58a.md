<!-- version-type: patch -->

# @furystack/shades-common-components

## 🔧 Chores

- Added `eslint-disable` comments for intentional `no-css-state-hooks` usage in `Input` (focused state) and `Select` (isFocused state) components where CSS state management via `useState` is the intended pattern

## 🧪 Tests

- Refactored `CacheView` tests to use `using()` / `usingAsync()` wrappers for `Cache` disposal, ensuring proper cleanup even if assertions fail
