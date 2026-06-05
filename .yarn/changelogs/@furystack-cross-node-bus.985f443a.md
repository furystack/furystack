<!-- version-type: major -->

# @furystack/cross-node-bus

## 💥 Breaking Changes

### `CrossNodeBusCapabilities` requires a `crossNodeDelivery` flag

`CrossNodeBusCapabilities` gains a **required** `crossNodeDelivery: boolean` field declaring whether an adapter actually delivers messages across OS processes / network nodes. Any external adapter that constructs a `CrossNodeBusCapabilities` object must now set this flag or it will no longer compile.

**Impact:** Authors of custom `CrossNodeBus` adapters.

**Migration:** Add `crossNodeDelivery` to your capabilities object — `true` for transports that cross process/node boundaries (e.g. Redis), `false` for in-process buses.

```typescript
// ❌ Before
const capabilities: CrossNodeBusCapabilities = { /* ... */ }

// ✅ After
const capabilities: CrossNodeBusCapabilities = { /* ... */, crossNodeDelivery: true }
```

## ✨ Features

### `crossNodeDelivery` capability flag

`InProcessCrossNodeBus` reports `crossNodeDelivery: false`. This lets consumers (notably `@furystack/task-runner`) refuse multi-node deployments that are wired to an in-process bus at boot instead of silently dropping cross-node progress events.
