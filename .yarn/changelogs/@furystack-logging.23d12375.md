<!-- version-type: minor -->

# @furystack/logging

## 🐛 Bug Fixes

- `AbstractLogger.fatal()` now catches errors from `addEntry()` and logs them via `console.error` instead of letting them propagate — fatal log persistence failures no longer crash the caller

## 🧪 Tests

- Added test verifying `fatal()` does not throw when `addEntry()` fails
