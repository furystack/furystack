<!-- version-type: minor -->

# @furystack/mongodb-store

## ✨ Features

### Lifecycle events in `MongoClientFactory`

`MongoClientFactory` now extends `EventHub` and emits events for client lifecycle:

- `onClientCreated` — emitted when a new MongoDB client is created, with `{ url }`
- `onDisposed` — emitted when the factory is disposed

```typescript
const factory = injector.getInstance(MongoClientFactory)

factory.addListener('onClientCreated', ({ url }) => {
  console.log(`MongoDB client created for ${url}`)
})
```

## 🧪 Tests

- Added tests for `onClientCreated` event emission on new client creation
- Added test verifying `onClientCreated` is not emitted when returning a cached client
