<!-- version-type: patch -->

# @furystack/inject

## 📚 Documentation

- Rewrote JSDoc on the public type surface (`Token`, `SyncToken`, `AsyncToken`, `AnyToken`, `ServiceContext`, `DefineServiceOptions`) and the `defineService` / `defineServiceAsync` / `Injector` exports to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints (token identity, async resolution rules, factory caching, dispose callbacks), and cross-linked the sync/async variants instead of re-explaining lifetime semantics.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
