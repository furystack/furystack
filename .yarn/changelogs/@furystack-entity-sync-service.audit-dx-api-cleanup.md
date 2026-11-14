<!-- version-type: major -->

# @furystack/entity-sync-service

## 💥 Breaking Changes

- Removed the deprecated `changelogRetentionMs` option from `ModelSyncOptions` and `registerModel()`. Replay retention is owned by the configured cross-node bus adapter.
