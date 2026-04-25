<!-- version-type: major -->

# @furystack/shades-mfe

## 💥 Breaking Changes

- `createShadesMicroFrontend` and `MicroFrontend` now call `injector.createScope(...)` instead of the removed `injector.createChild(...)`. No changes to the exported API surface. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the monorepo-wide DI changes.
