<!-- version-type: major -->

# @furystack/shades-showcase-app

## 💥 Breaking Changes

End-to-end update to the functional DI conventions. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale and patterns.

- All `.getInstance(X)` → `.get(X)`, `new Injector()` → `createInjector()` in the root bootstrap, `createChild(...)` → `createScope(...)`, `setExplicitInstance(...)` → `bind(...)`.
- `GridPageService` converted from `@Injectable({ lifetime: 'singleton' })` class + `@Injected` property to a `defineService` factory. Module-scope `defineStore` / `defineDataSet` tokens replace the old `addStore` + `getRepository().createDataSet()` calls; the factory owns a `useSystemIdentityContext` scope disposed via `onDispose`.
- `themes.tsx` dropped its per-block `createChild() + setExplicitInstance(new ThemeProviderService())` dance. The global singleton + CSS variables scoped to each block's wrapper ref are functionally equivalent.
