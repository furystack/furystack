<!-- version-type: patch -->

# @furystack/shades

## 🐛 Bug Fixes

- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `LocationService` (`onLocationPathChanged`, `onLocationHashChanged`, `onLocationSearchChanged`) that could cause memory leaks when the service is disposed
- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `ScreenService` (`orientation` and `screenSize.atLeast` observables) that could cause memory leaks when the service is disposed

## 🧪 Tests

- Added `eslint-disable` comment in `vnode.integration.spec.tsx` for a test that intentionally uses `useState('isActive')` to verify re-render behavior
