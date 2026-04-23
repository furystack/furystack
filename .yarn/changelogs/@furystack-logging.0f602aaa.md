<!-- version-type: major -->

# @furystack/logging

## 💥 Breaking Changes

Logger internals migrated to functional DI. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- `useLogging(injector, ...loggers)` and `getLogger(injector)` keep their public shapes; each entry may be a `Logger` instance or a `Token<Logger, 'singleton'>`. Internally the helper now uses `injector.bind(LoggerRegistry, ...)` + `injector.invalidate(LoggerCollection)` instead of `setExplicitInstance`.
- Custom loggers are declared via `defineService({ name, lifetime: 'singleton', factory: () => yourLogger })` — the `@Injectable({ lifetime: 'singleton' })` decorator pattern no longer exists.
- Added `useScopedLogger(ctx)` helper for use inside `defineService` factories: returns a `ScopedLogger` whose scope is the owning service's token name.
