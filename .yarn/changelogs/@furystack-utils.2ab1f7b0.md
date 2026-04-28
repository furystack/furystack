<!-- version-type: patch -->

# @furystack/utils

## 📚 Documentation

JSDoc rewrite across the public API to follow the new value-test guidance — drop restate-the-type narration, keep intent / trade-offs / constraints, add `@example` only where usage is not obvious from the signature.

- **Disposal + concurrency primitives** — `Semaphore`, `using` / `usingAsync`, `sleepAsync`, `isDisposable` / `isAsyncDisposable`. Calls out the `AbortSignal` plumbing on `Semaphore`, the disposal-on-throw guarantees of `using`, and the dispose-error swallow rules.
- **Observable surface** — `ObservableValue`, `ValueObserver`, `EventHub`. Tightens `subscribe` / `unsubscribe` / `getValue` semantics, documents `ObservableAlreadyDisposedError`, and adds an `@example` for the `using(...)` + `subscribe(...)` flow.
- **Helpers** — `PathHelper`, `debounce`, `deepMerge`, `sortBy`, `tuple`. Mostly type-restating narration removed; constraint notes kept (e.g. `deepMerge` shallow-copies arrays, `sortBy` is a stable sort).

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
