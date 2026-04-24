<!-- version-type: major -->

# @furystack/shades

## 💥 Breaking Changes

All Shades services are now plain-object factories behind DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- `LocationService`, `RouteMatchService`, `ScreenService`, and `SpatialNavigationService` are now interface + singleton token pairs. No class exports. Factory closures hold state and register `onDispose` teardown (event listeners, `history.pushState`/`replaceState` restoration, etc.).
- Added `LocationServiceSettings` and `SpatialNavigationSettings` singleton tokens with sensible defaults. `useCustomSearchStateSerializer(injector, serialize, deserialize)` and `configureSpatialNavigation(injector, options)` `bind` the settings and `invalidate` the dependent service. `useCustomSearchStateSerializer` preserves the v6 "must be called before first resolve" contract by throwing if `LocationService` has already been resolved (it patches `history.pushState`/`replaceState` and registers global listeners on construction, so a late rebind would leak the previous instance until injector disposal).
- `injector.cachedSingletons` is gone (it came from `@furystack/inject`). If you used `cachedSingletons.has(X)` to detect opt-in registration, replace with a nullable scoped token (`Token<T | null, 'scoped'>`, default `null`) bound by the parent component.
- `hasInjectorReference` is gone. `shade.ts` now inlines an `instanceof Injector` check on `props.injector`.
- `Constructable` import moved from `@furystack/inject` to `@furystack/core`. This package now has a direct `@furystack/core` dependency.
- `shade.ts` keeps its bare `new Injector()` fallback for components rendered outside an initialized DI context — this is documented and intentional. Apps should still go through `initializeShadeRoot`.
