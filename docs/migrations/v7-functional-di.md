# Migrating to Functional DI (v7)

FuryStack v7 replaces the decorator-era dependency injection with a
token-based, functional API. This guide is the authoritative reference for
the release — every package CHANGELOG links here for rationale, patterns,
and common pitfalls, and keeps its own entry to the package-specific API
deltas.

## Prerequisites

- **Node.js ≥ 22.** Tests and Shades-based apps require the newer WHATWG
  streams / jsdom combination. Older Node will fail with `ERR_REQUIRE_ESM`
  when the jsdom environment boots.
- **TypeScript 5.x.** The new DI relies on `const` type parameters and
  refined inject signatures.
- **Yarn 4.x.** No change from v6 — mentioned for completeness.

---

## 1. Core concept

**Before (v6):** classes decorated with `@Injectable`, dependencies pulled
via `@Injected`. The `Injector` resolved classes by constructor.

**After (v7):** services are declared with `defineService` /
`defineServiceAsync`, which return opaque **tokens**. The `Injector`
resolves tokens, caches instances per lifetime, and runs the factories'
`onDispose` callbacks on teardown. There are no decorators.

```ts
// v6
@Injectable({ lifetime: 'singleton' })
class MyService {
  @Injected(Dependency)
  declare private dep: Dependency
  public doSomething() {
    /* ... */
  }
}
const svc = injector.getInstance(MyService)

// v7
const MyService = defineService({
  name: 'my-app/MyService',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const dep = inject(Dependency)
    return {
      doSomething: () => {
        /* ... */
      },
    }
  },
})
const svc = injector.get(MyService)
```

---

## 2. Global API deltas

| v6                                                             | v7                                                  | Notes                                                                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@Injectable({ lifetime })` + `@Injected(Token)`               | `defineService({ name, lifetime, factory })`        | Decorators are gone. Factories produce the instance; `ctx.inject` resolves deps.                                                                                                                             |
| `new Injector()`                                               | `createInjector()`                                  | `new Injector()` still works at runtime for tests. Prefer `createInjector()` for clarity.                                                                                                                    |
| `injector.getInstance(Class)`                                  | `injector.get(Token)`                               | Sync only. Async tokens must use `injector.getAsync(Token)`.                                                                                                                                                 |
| `injector.setExplicitInstance(instance, Class)`                | `injector.bind(Token, () => instance)`              | `bind` drops any cached instance; `invalidate(Token)` clears the cache without rebinding.                                                                                                                    |
| `injector.createChild({ owner })`                              | `injector.createScope({ owner })`                   | Scoped tokens cache on the scope that first resolves them.                                                                                                                                                   |
| `injector.cachedSingletons.has(Token)`                         | **Use a nullable scoped token.**                    | Define `const FooContextToken: Token<Foo \| null, 'scoped'> = defineService({ ..., factory: () => null })` and bind it from the parent. Consumers call `injector.get(FooContextToken)` and branch on `null`. |
| `addStore(injector, store)`                                    | `defineStore({ name, model, primaryKey, factory })` | Returns a `StoreToken` that self-disposes on injector teardown. Backend packages ship dedicated `defineXxxStore` helpers.                                                                                    |
| `getRepository(injector).createDataSet(Model, 'pk', settings)` | `defineDataSet({ name, store, settings? })`         | Returns a `DataSetToken`. Resolve via `injector.get(token)` or `getDataSetFor(injector, token)`.                                                                                                             |
| `StoreManager` + `getStoreFor`                                 | Gone.                                               | DataSet-first data access; stores are resolved internally via the DataSet. The `furystack/no-direct-store-token` lint rule flags direct `injector.get(StoreToken)` in app code.                              |

### Injector methods

- `get(token)` — synchronous resolve; rejects async tokens at compile time.
- `getAsync(token)` — resolves sync or async tokens; returns `Promise<T>`.
- `bind(token, factory)` — override on the injector that owns the cached
  instance. Drops any cached value. Use for bootstrap (persistent stores
  behind throw-by-default tokens) and for test stubs.
- `invalidate(token)` — drop the cached instance without rebinding.
- `createScope({ owner })` — child injector with its own cache.
- `withScope(parent, async (scope) => …)` — scope-create + dispose wrapper.
- `injector[Symbol.asyncDispose]()` — disposes the injector and every
  registered `onDispose` callback (LIFO).

---

## 3. Per-package deltas

### `@furystack/inject`

- **Removed:** `@Injectable`, `@Injected`, class-based DI.
- **Removed (silent behavior change):** `Injector.getInstance` used to automatically call `init(injector)` on any freshly constructed singleton that exposed that method (introduced in PR #329). v7 has no equivalent. Services that need async bootstrap should use `defineServiceAsync` + `injector.getAsync`; services that need sync setup should fold it into the `defineService` factory body. **Do not** expose a public `init()` method and ask consumers to call it. See "`init(injector)` auto-invocation removed" under Common pitfalls for the full migration recipe.
- **Added:** `defineService`, `defineServiceAsync`, `isToken`, `createInjector`, `withScope`, `Injector.bind`, `Injector.invalidate`, `Injector.createScope`, `ServiceContext`, `Token`, `Lifetime`.
- **Renamed:** `getInstance` → `get`; `setExplicitInstance` → `bind`; `createChild` → `createScope`.
- Tokens are plain-object handles with a fresh `Symbol` id — cross-author collisions are structurally impossible; a duplicate module instance of a single library still produces two tokens (rare, obvious failure mode).

### `@furystack/core`

- **Removed:** `StoreManager`, `addStore`.
- **Added:** `defineStore({ name, model, primaryKey, factory })` → `StoreToken<T, PK>` (token carries `model` + `primaryKey` metadata and self-disposes on injector teardown); `IdentityContext` interface + token; `useSystemIdentityContext({ injector, username })` (caller responsible for disposal).
- **Moved:** `Constructable` moved from `@furystack/inject` → `@furystack/core`. Any package that imported `Constructable` needs to swap its import and add `@furystack/core` as a dependency.

### `@furystack/repository`

- **Removed:** `Repository` class, `getRepository`, `Repository.createDataSet`.
- **Added:** `defineDataSet({ name, store, settings? })` → `DataSetToken<T, PK>`; `getDataSetFor(injector, dataSetToken)`.
- Endpoint generators, `useEntitySync`, and `SubscriptionManager.registerModel` now take a `DataSetToken` directly — no more `(Model, 'primaryKey')` tuples.

### `@furystack/security`

- **Removed:** `@Injectable`-based `PasswordAuthenticator` / `CryptoPasswordHasher`.
- **Added:** `SecurityPolicy` interface + token, `CryptoPasswordHasher` token, `PasswordAuthenticator` token; `usePasswordPolicy(injector, overrides?)`.
- `PasswordCredentialStore` and `PasswordResetTokenStore` are throw-by-default `StoreToken`s. Bind persistent implementations before resolving anything downstream.

### `@furystack/rest-service`

- **Removed:** `ServerManager`, `ApiManager`, `StaticServerManager`, `ProxyManager` classes.
- **Added:** `HttpServerPoolToken` (singleton HTTP server pool), `ServerTelemetryToken` (event hub for `onApiRequestError` / `onProxyFailed` / `onWebSocketActionFailed` / `onWebSocketProxyFailed`), `HttpAuthenticationSettings` interface + token, `HttpUserContext` interface + token.
- `useRestService` / `useHttpAuthentication` / `useStaticFiles` / `useProxy` keep their shapes; internals fully token-based.
- Endpoint generators (`createGetCollectionEndpoint`, etc.) take a `DataSetToken`.
- `UserStore` + `SessionStore` are throw-by-default. Apps bind concrete persistent stores at bootstrap.
- Telemetry subscriptions move from `injector.getInstance(ProxyManager).subscribe(...)` to `injector.get(ServerTelemetryToken).subscribe(...)`.
- `HttpUserContext.user` cache moved from a private field to a `WeakMap<request.headers, Promise<User>>` so ancestor-cached instances don't leak identity across scopes.

### `@furystack/websocket-api`

- **Removed:** `WebSocketApiSettings` token; class-based `WebSocketAction`.
- **Added:** `WebSocketApi` interface + `useWebSocketApi({ injector, port, hostName?, path?, actions? })` (returns a handle; no token). Multi-endpoint capable on a single injector.
- `WebSocketAction` is a plain object: `{ canExecute(ctx): boolean; execute(ctx & { injector }): Promise<void> }`. Each message gets a fresh injector scope.
- Action failures route to `ServerTelemetryToken#onWebSocketActionFailed`; connect/disconnect stay on the returned handle.

### `@furystack/i18n`

- **Removed:** library-level `I18NService` DI token.
- **Added:** `defineI18N<TKeys>(defaultLanguage, ...additionalLanguages)` mints a per-app singleton token preserving literal key inference. `I18NServiceImpl` is still exported for direct-instantiation tests.

### `@furystack/auth-jwt`

- **Added:** `JwtAuthenticationSettings` interface + singleton token (default throws); `JwtTokenService` interface + singleton token; `RefreshTokenStore` + `RefreshTokenDataSet` (throw-by-default).
- `useJwtAuthentication(injector, { secret, ... })` binds settings and appends the Bearer provider to `HttpAuthenticationSettings`. Shallow-merges `fingerprintCookie` overrides.
- Refresh action runs in a short-lived system-identity scope because the caller is unauthenticated at refresh time.

### `@furystack/auth-google`

- **Added:** `GoogleAuthenticationSettings` interface + token (default throws); `GoogleLoginService` interface + singleton token; `useGoogleAuthentication(injector, { clientId, ... })`.
- `createGoogleLoginAction(strategy)` resolves `GoogleLoginService` from the injector. CSRF double-submit is opt-in via `enableCsrfCheck`.

### `@furystack/entity-sync-service`

- **Removed:** `@Injectable`-based `SubscriptionManager`; `registerModel(Model, 'primaryKey', opts)` tuple form.
- **Added:** `SubscriptionManager` interface + singleton token (class-behind-token); `registerModel(dataSetToken, options?)`; `SyncSubscribeAction`, `SyncUnsubscribeAction` are plain `WebSocketAction` descriptors; `useEntitySync(injector, { models: [dataSetTokenOrOpts] })`.

### `@furystack/entity-sync-client`

- **Removed:** `@Injectable({ lifetime: 'explicit' })` on `EntitySyncService` (runtime no-op).
- **Added:** `defineEntitySyncService(opts)` mints a per-app singleton token; `createSyncHooks(syncToken)` returns `{ useEntitySync, useCollectionSync }` for Shades integration.
- `Constructable` import moved from `@furystack/inject` to `@furystack/core`.

### `@furystack/shades`

- **Declassed:** `LocationService`, `RouteMatchService`, `ScreenService`, `SpatialNavigationService`, `LocationServiceSettings`, `SpatialNavigationSettings` are plain-object factories behind singleton tokens. No class exports.
- **Added:** `useCustomSearchStateSerializer(injector, serialize, deserialize)` and `configureSpatialNavigation(injector, opts)` switch to `bind` + `invalidate` on the settings tokens. `useCustomSearchStateSerializer` still enforces the v6 "must be called before first resolve" contract — it throws if `LocationService` has already been resolved (history patching / global listeners are not re-runnable).
- `injector.cachedSingletons.has(X)` is gone — replaced by nullable scoped tokens where a "register me if a parent did" surface is needed.
- `Constructable` import moved to `@furystack/core`.

### `@furystack/shades-common-components`

- **Declassed:** `ThemeProviderService`, `NotyService`, `LayoutService`, `FormService`.
- **Added:** `FormContextToken: Token<FormService | null, 'scoped'>` (default `null`) for inputs to detect the presence of a parent `<Form>`; `createLayoutService(targetElement?)` bound on `createScope` by `<PageLayout>`; `createFormService<T>()`.
- `SuggestManager` / `CommandPaletteManager` kept as plain classes (instantiated in component bodies, never DI-resolved).

### Store adapters — `@furystack/filesystem-store`, `@furystack/mongodb-store`, `@furystack/redis-store`, `@furystack/sequelize-store`

- **Removed:** `useFileSystemStore(...)`, `useMongoDb(...)`, `useRedis(...)`, `useSequelize(...)`.
- **Added:** `defineFileSystemStore`, `defineMongoDbStore`, `defineRedisStore`, `defineSequelizeStore` — each returns a `StoreToken<T, PK>`.
- `MongoClientFactory` and `SequelizeClientFactory` converted to `defineService({ lifetime: 'singleton' })` tokens that pool clients and dispose them on injector teardown.
- Redis keeps its user-provided-client contract: caller connects and quits the `redis` client.

### `@furystack/shades-mfe`, `@furystack/shades-i18n`, `@furystack/shades-nipple`, `@furystack/shades-lottie`

- `shades-mfe`: `createChild(...)` → `createScope(...)` in `createShadesMicroFrontend` / `MicroFrontend`.
- `shades-i18n`: test fixtures now import `I18NServiceImpl` (concrete class) rather than treating the `I18NService` interface as constructable.
- `shades-nipple`, `shades-lottie`: no DI surface changes; rebuild cleanly.

### `@furystack/eslint-plugin`

- **Removed:** `injectable-consistent-inject` (decorator-era rule; TS already errors on removed API).
- **Removed:** `no-direct-physical-store` (dead once `StoreManager` was removed).
- **Added:** `no-direct-store-token` — structurally detects `injector.get(StoreToken)` / `getAsync(StoreToken)` calls in application code. Same allow-list as before (`packages/core/`, `packages/repository/`, `packages/*-store/`, specs).

### `@furystack/shades-showcase-app`

- Mechanical rewrite: `getInstance` → `get`, `new Injector()` → `createInjector()`, `createChild` → `createScope`, `setExplicitInstance` → `bind`, `addStore` → `defineStore`.
- `GridPageService` converted from `@Injectable` class → `defineServiceAsync` factory with module-scope `defineStore` / `defineDataSet` tokens. The factory seeds 100 demo items and wires the `findOptions → collectionService` pipeline before resolving — no `init()` method is exposed. The `/data-display/grid` route's `<LazyLoad>` loader parallelizes the page-chunk import and `shadesInjector.getAsync(GridPageService)`, then hands the fully-initialized instance into `<GridPage service={...}>` (and forward into `<GridStatus service={...}>`) as an explicit prop. This serves as the reference implementation of the async-bootstrap pattern documented under Common pitfalls.
- `themes.tsx` drops its per-block child-injector dance (global token + CSS variables).

### `@furystack/utils`, `@furystack/rest`, `@furystack/rest-client-fetch`, `@furystack/logging`, `@furystack/cache`

- `@furystack/utils`, `@furystack/rest`, `@furystack/rest-client-fetch`: no public DI surface. The major bump is to keep the monorepo version line consistent; call-sites unchanged.
- `@furystack/logging`: `useLogging(injector, ...loggers)` and `getLogger(injector)` preserved; internals are now `defineService`-based. Custom loggers declared via `defineService({ lifetime: 'singleton', factory: () => createLogger(backend) })`. **`AbstractLogger` was removed** — replace `class MyLogger extends AbstractLogger { addEntry(entry) { ... } }` with `createLogger(async (entry) => { ... })`, which also gives you level convenience methods, `withScope`, and the error-isolation escalation ladder for free.
- `@furystack/cache`: no DI surface; major bump for consistency.

---

## 4. Common migration recipes

### Declaring a service

```ts
// v6
@Injectable({ lifetime: 'singleton' })
class Counter {
  private value = 0
  public increment(): number {
    return ++this.value
  }
}
const svc = injector.getInstance(Counter)

// v7
const Counter = defineService({
  name: 'my-app/Counter',
  lifetime: 'singleton',
  factory: () => {
    let value = 0
    return { increment: () => ++value }
  },
})
const svc = injector.get(Counter)
```

### Binding a persistent store behind a throw-by-default token

```ts
import { UserStore } from '@furystack/rest-service'
import { defineSequelizeStore } from '@furystack/sequelize-store'

const AppUserStore = defineSequelizeStore<User, UserModel, 'username'>({
  name: 'my-app/UserStore',
  model: User,
  sequelizeModel: UserModel,
  primaryKey: 'username',
  options: { dialect: 'postgres' /* ... */ },
})

// Make the shipped throw-by-default token resolve to the persistent store
injector.bind(UserStore, (ctx) => ctx.inject(AppUserStore))
```

### Replacing `cachedSingletons.has(X)`

```ts
// v6
const formService = injector.cachedSingletons.has(FormService) ? injector.getInstance(FormService) : null

// v7 — a nullable scoped token, default null
const FormContextToken: Token<FormService | null, 'scoped'> = defineService({
  name: 'my-app/FormContextToken',
  lifetime: 'scoped',
  factory: () => null,
})

// <Form /> binds a real instance on its own scope:
scope.bind(FormContextToken, () => createFormService())

// Consumers branch on null:
const form = injector.get(FormContextToken)
```

### Test bootstrap

```ts
// v6
await usingAsync(new Injector(), async (injector) => {
  injector.setExplicitInstance(new Logger(), LoggerCollection)
  const svc = injector.getInstance(UserService)
  // ...
})

// v7
await usingAsync(createInjector(), async (injector) => {
  injector.bind(LoggerCollection, () => fakeLogger)
  injector.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))
  const svc = injector.get(UserService)
  // ...
})
```

---

## 5. Common pitfalls

### Scope caching leaks across ancestors

`findCached` walks the scope parent chain. If any ancestor (usually the
root) has already resolved a scoped token, every descendant scope returns
the same cached instance. Any state stored on that instance is shared
across scopes.

**Fix options:**

1. Do setup inside a short-lived scope:
   ```ts
   await usingAsync(injector.createScope({ owner: 'setup' }), async (setup) => {
     setup.get(HttpUserContext).cookieLogin(...)
   })
   ```
2. Store per-scope state in a `WeakMap` keyed by per-scope identity
   (request headers, socket, etc.) instead of on the instance itself. This
   is the pattern `HttpUserContext.userCache` uses.

### Eager `inject(X)` in factories

If a factory resolves a dependency it doesn't always need (e.g. auth-only
paths), it forces that token's factory to run for every consumer. In
throw-by-default tokens this causes "store not configured" failures for
tests that never exercise the auth path.

**Fix:** pass `() => ctx.inject(X)` to the service implementation and
resolve lazily on the code path that needs it.

### Generic widening through wrappers

When a helper like `defineFileSystemStore<T, const TPrimaryKey extends keyof T>({...})`
forwards its generics into `defineStore({...})`, TypeScript collapses
`TPrimaryKey` back to `keyof T` unless you pass explicit generics:

```ts
defineFileSystemStore<TestClass, 'id'>({ ... })
```

Same for `defineStore<T, TPrimaryKey>({ ... })` and
`defineDataSet<T, 'pk', WithOptionalId<T, 'pk'>>({ ... })` inside spec
helpers.

### Disposal from outside a factory context

`ctx.onDispose` is only available inside a factory. `useXxx` helpers that
need to register disposal (e.g. close a pooled HTTP server) push callbacks
onto a scoped `CleanupRegistry` token — see
`packages/websocket-api/src/use-websocket-api.ts` for the pattern. Callbacks
run in reverse registration order.

### `init(injector)` auto-invocation removed — use `defineServiceAsync` for async bootstrap

In v6, `Injector.getInstance(X)` inspected the freshly constructed singleton and, if it exposed an `init(injector)` method, called it as part of construction (PR #329). v7 has no equivalent. Services that relied on the auto-call silently do nothing on resolve, which manifests as empty state (unseeded stores, missing subscriptions, uninitialized caches).

Exposing a public `init()` on a service and asking consumers to call it is an antipattern in v7 — it leaks lifecycle into every call site and invites drift the moment a consumer forgets. The idiomatic replacements, in order of preference:

#### A. Setup is synchronous → fold it into the `defineService` factory body

```ts
// v6
@Injectable({ lifetime: 'singleton' })
class ThemeWatcher {
  public init(_injector: Injector) {
    window.addEventListener('beforeunload', this.persist)
  }
}

// v7 — subscriptions wired during construction, torn down via onDispose
const ThemeWatcher = defineService({
  name: 'my-app/ThemeWatcher',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const persist = () => {
      /* ... */
    }
    window.addEventListener('beforeunload', persist)
    onDispose(() => window.removeEventListener('beforeunload', persist))
    return { persist }
  },
})
```

#### B. Setup requires `await` → use `defineServiceAsync` + `injector.getAsync`

The canonical pattern for genuinely async-bootstrapped services: the factory returns `Promise<T>`, and consumers resolve the token through `injector.getAsync(Token)`. The instance is handed over fully initialized — no readiness flag, no `init()` method, no loading state for the consumer to branch on. If the promise has not settled yet, `getAsync` returns the same pending promise (concurrent callers share it; singleton lifetime caches the resolved value).

```ts
// v7 async-bootstrap service
export interface UserCache {
  readonly users: User[]
  // ...
}

export const UserCache = defineServiceAsync({
  name: 'my-app/UserCache',
  lifetime: 'singleton',
  factory: async ({ inject, injector, onDispose }) => {
    const dataSet = inject(UserDataSet)
    const scope = useSystemIdentityContext({ injector, username: 'UserCache' })
    const users = await dataSet.find(scope, {})
    onDispose(() => scope[Symbol.asyncDispose]())
    return { users }
  },
})
```

**Consumption — route-level loader wrapped in `<LazyLoad>`, service passed as a prop:**

Components should not own the async boundary. Put it at the route loader, kick off the chunk download and the service bootstrap in parallel, and pass the resolved instance into the page as an explicit prop. The page then has zero lifecycle concerns and no injector dependency for this service.

```tsx
// routes.tsx
'/users': {
  component: () => (
    <LazyLoad
      loader={<PageLoader />}
      component={async () => {
        const pagePromise = import('./pages/users/index.js')
        const servicePromise = import('./pages/users/user-cache.js').then((m) =>
          rootInjector.getAsync(m.UserCache),
        )
        const [{ UsersPage }, userCache] = await Promise.all([pagePromise, servicePromise])
        return <UsersPage userCache={userCache} />
      }}
    />
  ),
},
```

```tsx
// pages/users/index.tsx
export type UsersPageProps = { userCache: UserCache }

export const UsersPage = Shade<UsersPageProps>({
  customElementName: 'my-users-page',
  render: ({ props }) => {
    const { userCache } = props
    // userCache is fully initialized; render synchronously
    return <UserList users={userCache.users} />
  },
})
```

Reference implementation in this repo: `GridPageService` in `@furystack/shades-showcase-app` — `defineServiceAsync` factory seeds the demo store inside the factory body; the `/data-display/grid` route resolves the token via `shadesInjector.getAsync(GridPageService)` and passes the instance to `<GridPage service={...}>` and `<GridStatus service={...}>`.

#### C. "Lazy on first call" — methods are `Promise<T>`, init hides behind them

When the service only needs setup on its first call path (e.g. a database-backed store), hide the init inside an internal `initPromise` and make every public method `Promise<T>`. Consumers never know initialization happened. Examples: `SequelizeStore.getModel()`, `MongoStore.getCollection()`.

#### Antipatterns

- Public `init()` method the consumer must remember to call. (Pick B instead.)
- Sync `defineService` + internal `isInitialized` flag the consumer has to poll or subscribe to. (Pick B or C instead.)
- Fire-and-forget async work inside a sync factory. (Leaves the service temporarily in a broken state; races with the first consumer call.)

### Binding settings after first resolve

`bind(SettingsToken, ...)` replaces the factory on the owning injector and
drops the cache for the settings token — but not for services that have
already resolved it. Rebind + invalidate:

```ts
injector.bind(LocationServiceSettings, () => ({ ...custom }))
injector.invalidate(LocationService)
```

---

## 6. Testing checklist

- [ ] Replace `new Injector()` with `createInjector()` where readability helps.
- [ ] Replace every `injector.getInstance(X)` with `injector.get(X)`.
- [ ] Replace every `injector.setExplicitInstance(instance, X)` with `injector.bind(X, () => instance)`.
- [ ] Replace every `injector.createChild(opts)` with `injector.createScope(opts)`.
- [ ] Replace `addStore(injector, new Store({ ... }))` with `defineStore({ ... })` declared at module scope and `injector.bind(Token, factory)` if the token is shipped as throw-by-default.
- [ ] Replace `getRepository(injector).createDataSet(Model, 'pk', settings)` with `defineDataSet({ name, store, settings })`.
- [ ] Replace endpoint generators' `{ model, primaryKey }` arg with a `DataSetToken`.
- [ ] Update `registerModel(Model, 'pk', opts)` → `registerModel(DataSetToken, opts)`.
- [ ] Remove `@Injectable` / `@Injected` decorators. Convert classes to factories where appropriate; keep classes behind tokens when stateful (see `SubscriptionManagerImpl`, `I18NServiceImpl`).
- [ ] Audit any `cachedSingletons.has(...)` usage and replace with a nullable scoped token.
- [ ] Run `yarn build && yarn lint && yarn test`.

---

## 7. Need help?

- The internal [`functional-di-migration-plan.md`](../internal/functional-di-migration-plan.md)
  captures the per-package migration history and the design decisions locked in
  during the effort. Read it when you want "why" instead of "how".
- The `.cursor/rules/LIBRARY_DEVELOPMENT.md` file captures the post-v7
  coding conventions for future work.
- For bugs or questions not covered here, please open an issue on
  [github.com/furystack/furystack](https://github.com/furystack/furystack).
