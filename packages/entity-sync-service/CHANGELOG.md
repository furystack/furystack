# Changelog

## [0.1.0] - 2026-02-12

### ✨ Features

### New package: server-side entity synchronization

Initial release of `@furystack/entity-sync-service`, providing server-side change tracking and WebSocket push for entity synchronization.

Core features:

- **`SubscriptionManager`** — singleton service that tracks per-model changelogs with sequence numbers, manages entity and collection subscriptions, and dispatches incremental updates to connected WebSocket clients
- **`useEntitySync`** — helper function to register models for synchronization after Repository and DataSets are configured
- **`SyncSubscribeAction`** / **`SyncUnsubscribeAction`** — WebSocket actions compatible with `@furystack/websocket-api`
- **Delta sync** — maintains a per-model changelog for sending only changes since client's `lastSeq`
- **Debounced notifications** — configurable debounce window for batching rapid changes before re-evaluating collection subscriptions
- **Query caching** — optional TTL-based caching for `find()` results on collection subscriptions

### ⬆️ Dependencies

- Added `@furystack/core` (workspace:^)
- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/repository` (workspace:^)
- Added `@furystack/websocket-api` (workspace:^)
- Added `ws` ^8.19.0

All notable changes to the `@furystack/entity-sync-service` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
