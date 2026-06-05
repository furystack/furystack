<!-- version-type: patch -->

# furystack

## ✨ Features

### Distributed task management subsystem

This release introduces the distributed task management stack across several new packages:

- `@furystack/task-runner` — transport-agnostic primitive for submitting, running, and observing distributed tasks, with a replay-based continuation engine, DAG composition (`spawnChild` / `awaitChildren`), an in-process queue adapter, a REST + WebSocket surface, a blob retention sweeper, and testing helpers.
- `@furystack/redis-task-runner` — Redis Streams queue adapter for persistent, multi-node, broker-side-reclaimable task execution.
- `@furystack/task-runner-client` — browser-side SDK for submitting, querying, cancelling, and live-subscribing to tasks.
- `@furystack/blob-store` + `@furystack/filesystem-blob-store` + `@furystack/s3-blob-store` — transport-agnostic blob storage with filesystem and S3-compatible adapters.
- `@furystack/task-runner-examples` — a worked video-encoder example (private).

`@furystack/redis-store`, `@furystack/cross-node-bus`, `@furystack/redis-cross-node-bus`, and `@furystack/eslint-plugin` gained supporting changes — see their individual changelogs.

## 📚 Documentation

- Expanded `docs/internal/distributed-task-management.md` with the full design (architecture, capability matrices, milestone implementation notes).

## 📦 Build

- `docker-compose.yml` now exposes a MinIO (S3-compatible) endpoint and Redis for the new packages' integration suites.
- Added the new packages to the build (`packages/tsconfig.json`) and test (`vitest.config.mts`) project configuration.
