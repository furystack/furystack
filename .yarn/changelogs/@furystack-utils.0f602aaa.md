<!-- version-type: major -->

# @furystack/utils

## 💥 Breaking Changes

- Version bumped to align with the monorepo-wide functional DI migration. No DI surface in this package; `ObservableValue`, `EventHub`, `Semaphore`, `Retrier`, `using` / `usingAsync`, and related primitives are unchanged. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the full picture on other packages.
