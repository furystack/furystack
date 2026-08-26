# Changelog

## [0.0.3] - 2026-08-26

### ⬆️ Dependencies

- Updated `ws` to `^8.21.1`
- Updated dependencies
- Raised dev `typescript` to `^7.0.2`, `@types/node` to `^26.1.1`, and `vitest` to `^4.1.10`. No source changes — dev-tooling bump only.

## [0.0.2] - 2026-06-05

### ✨ Features

### Initial release — worked examples for `@furystack/task-runner`

Private (unpublished) example package demonstrating end-to-end usage of the distributed task runner. Ships a video-encoder app that wires `@furystack/task-runner`, `@furystack/blob-store` / `@furystack/filesystem-blob-store`, and `@furystack/task-runner-client` together to exercise the real APIs.

- DAG composition via `spawnChild` / `awaitChildren` across probe → encode (chunked H.264) → mux → package → thumbnail handlers.
- Blob upload/download through the task runner's presigned-ticket flow.
- A runnable bootstrap (`yarn start`) plus an integration spec covering the full submit-to-completion flow.
