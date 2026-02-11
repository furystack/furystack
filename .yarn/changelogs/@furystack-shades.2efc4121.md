<!-- version-type: patch -->

# @furystack/shades

## 🐛 Bug Fixes

- Fixed `Router` and `NestedRouter` not abandoning stale navigations when routes change rapidly. Previously, a semaphore-based lock serialized navigations, allowing intermediate `onVisit`/`onLeave` callbacks to complete even after a newer navigation had been triggered. Now a version counter detects when a newer navigation has started and aborts the stale one, ensuring only the latest destination's lifecycle callbacks execute.

## 🧪 Tests

- Added tests for `Router` verifying that rapid navigation (e.g. clicking route B then immediately route C) skips intermediate route callbacks
- Added tests for `NestedRouter` verifying that rapid navigation abandons stale `onVisit` callbacks

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
