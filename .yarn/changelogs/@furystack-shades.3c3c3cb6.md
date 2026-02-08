<!-- version-type: patch -->
# @furystack/shades

## ⚡ Performance

### Microtask-based batched component updates

`updateComponent()` now schedules renders via `queueMicrotask()` instead of executing them synchronously. Multiple calls to `updateComponent()` within the same synchronous block (e.g. several observable changes) are coalesced into a single render pass, reducing unnecessary DOM updates.

## ✨ Features

- Exported `flushUpdates()` utility that returns a promise resolving after the current microtask queue is processed, allowing tests to reliably wait for batched renders to complete

## 🧪 Tests

- Updated integration tests to use `flushUpdates()` for asserting DOM state after microtask-based rendering
- Added test for batching multiple synchronous observable changes into a single render
- Added test for coalescing multiple `updateComponent()` calls into a single render pass
