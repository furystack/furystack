<!-- version-type: minor -->

# @furystack/shades

## ✨ Features

- Added `LocationService.replace()` method for SPA redirects that replaces the current history entry instead of pushing a new one, preventing intermediate URLs from polluting the browser's back/forward stack

## 🐛 Bug Fixes

- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `LocationService` (`onLocationPathChanged`, `onLocationHashChanged`, `onLocationSearchChanged`) that could cause memory leaks when the service is disposed
- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `ScreenService` (`orientation` and `screenSize.atLeast` observables) that could cause memory leaks when the service is disposed

## 🧪 Tests

- Added `eslint-disable` comment in `vnode.integration.spec.tsx` for a test that intentionally uses `useState('isActive')` to verify re-render behavior
