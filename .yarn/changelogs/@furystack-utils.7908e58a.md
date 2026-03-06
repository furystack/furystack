<!-- version-type: patch -->

# @furystack/utils

## 🧪 Tests

- Refactored all `Semaphore` tests to use `using()` / `usingAsync()` wrappers for proper disposal, ensuring cleanup even if assertions fail
- Added `eslint-disable` comment in `EventHub` test for intentional post-disposal behavior verification
