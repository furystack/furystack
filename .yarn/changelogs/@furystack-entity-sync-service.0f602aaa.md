<!-- version-type: major -->

# @furystack/entity-sync-service

## 💥 Breaking Changes

Subscription management is now a DI token and sync actions are plain descriptors. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Added `SubscriptionManager` interface + singleton token (class-behind-token). Resolve via `injector.get(SubscriptionManager)`.
- `registerModel` now takes a `DataSetToken` directly: `registerModel(dataSetToken, options?)`. `modelName` and `primaryKey` are derived from the token's metadata, so the old `(Model, 'primaryKey', options?)` tuple form is gone.
- `EntitySyncModelConfig` collapsed to `{ dataSet: DataSetToken<unknown, never> } & ModelSyncOptions`.
- `useEntitySync(injector, { models: [...] })` accepts `DataSetToken` values or `EntitySyncModelConfig` objects. Call it after the stores behind those datasets are bound.
- `SyncSubscribeAction` and `SyncUnsubscribeAction` are now plain `WebSocketAction` descriptors (`{ canExecute, execute({ injector, ... }) }`). Pass them to `useWebSocketApi` in the `actions` map.
