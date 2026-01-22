<!-- version-type: patch -->

# @furystack/core

## 🐛 Bug Fixes

- Fixed `getPort()` returning duplicate ports by reusing a shared generator instance instead of creating a new one on each call
