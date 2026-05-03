<!-- version-type: patch -->

# furystack

## 📦 Build

- Wired the new `@furystack/cross-node-bus` and `@furystack/redis-cross-node-bus` packages into `packages/tsconfig.json` reference graph and the `vitest.config.mts` unit / integration project lists.

## 📚 Documentation

- Added `docs/internal/cross-node-bus-spike.md` (PRD v1) — the design document for the new cross-node pub/sub primitive, its in-process and Redis Streams adapters, and the `IdentityEventBus` / `EntityChangeBus` facades layered on top.
- Added `docs/internal/distributed-task-management.md` — companion design note covering the future task-management subsystem that will sit on the same bus.
