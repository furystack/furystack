<!-- version-type: major -->

# @furystack/eslint-plugin

## 💥 Breaking Changes

Rule set aligned with the functional DI migration. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale and patterns.

- Removed `injectable-consistent-inject`. The decorator-era rule no longer has a target — `@Injectable` / `@Injected` are gone, and TypeScript already errors on every removed API.
- Removed `no-direct-physical-store`. The rule banned importing `StoreManager` from `@furystack/core`, which no longer exports that symbol; TypeScript catches direct imports at compile time.
- Added `no-direct-store-token`. Structurally detects `injector.get(StoreToken)` / `injector.getAsync(StoreToken)` calls in application code (via type services) and flags them. The allow-list preserves the previous semantics: `packages/core/`, `packages/repository/`, `packages/*-store/`, and any `*.spec.ts(x)` file may resolve store tokens directly. The `recommended` and `recommendedStrict` configs enable it as an `error`.
- Update `eslint.config.js` references: swap `'furystack/no-direct-physical-store'` → `'furystack/no-direct-store-token'`.
