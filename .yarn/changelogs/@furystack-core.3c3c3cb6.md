<!-- version-type: patch -->
# @furystack/core

## 🐛 Bug Fixes

- Fixed `getPort()` to assign deterministic port ranges per Vitest worker using `VITEST_POOL_ID` instead of a random base port, preventing port collisions in parallel test runs
