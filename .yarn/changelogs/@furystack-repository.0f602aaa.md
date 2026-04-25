<!-- version-type: major -->

# @furystack/repository

## 💥 Breaking Changes

The `Repository` class is gone — DataSets are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `Repository`, `getRepository(injector)`, `Repository.createDataSet(Model, 'pk', settings)`. Declare DataSets with `defineDataSet({ name, store, settings? })` at module scope; the returned `DataSetToken<T, PK>` resolves a configured `DataSet`.
- `getDataSetFor(injector, DataSetToken)` now takes a single token argument. The old `(injector, Model, 'pk')` overload is gone.
- Every consumer that used to take `{ model, primaryKey }` (endpoint generators, `registerModel`, etc.) now takes a `DataSetToken` directly.
