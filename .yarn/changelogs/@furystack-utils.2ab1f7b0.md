<!-- version-type: patch -->

# @furystack/utils

## 📚 Documentation

- Rewrote JSDoc across the public API (`ObservableValue`, `ValueObserver`, `EventHub`, `Semaphore`, `PathHelper`, `debounce`, `deepMerge`, `sortBy`, `tuple`, `using` / `usingAsync`, `sleepAsync`, `isDisposable` / `isAsyncDisposable`) to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints around disposal, error propagation, and concurrency, and added `@example` blocks where usage is not obvious from the signature (e.g. `ObservableValue`, `Semaphore`).

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
