# Functional DI Migration — Remaining Packages

## Status snapshot (done)

| Package                                                | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@furystack/utils`                                     | Pure, no DI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@furystack/inject`                                    | Migrated (defines the new API)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `@furystack/logging`                                   | Migrated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `@furystack/rest`                                      | Pure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@furystack/rest-client-fetch`                         | Pure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@furystack/core`                                      | Migrated — `defineStore`, `StoreToken`, `IdentityContext` interface+token, `useSystemIdentityContext`, `Constructable` moved from inject to core                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `@furystack/repository`                                | Migrated — `defineDataSet`, `DataSetToken`, no more `Repository` class, `getDataSetFor(i, token)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `@furystack/security`                                  | Migrated — `SecurityPolicy` interface+token, `CryptoPasswordHasher` token, `PasswordAuthenticator` token, `usePasswordPolicy(i, overrides?)`. `PasswordCredentialStore`/`PasswordResetTokenStore` throw-by-default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `@furystack/rest-service`                              | Migrated — `HttpServerPoolToken`, `ServerTelemetryToken`, `HttpAuthenticationSettings` interface+token, `HttpUserContext` interface+token (current-user cache is a private `WeakMap<request.headers, Promise<User>>` so ancestor-cached instances don't leak identity across scopes), `UserStore`/`SessionStore` throw-by-default, endpoint generators take `DataSetToken`, `useRestService`/`useHttpAuthentication`/`useStaticFiles`/`useProxy` unchanged signatures. Managers (`ServerManager`/`ApiManager`/`StaticServerManager`/`ProxyManager`) deleted                                                                                                                                                                                                                       |
| `@furystack/websocket-api`                             | Migrated — `WebSocketApi` interface + `useWebSocketApi` helper (no separate token/class), inline settings (no `WebSocketApiSettings`), `WebSocketAction` is now a plain `{ canExecute, execute({ injector }) }` descriptor, per-message injector scope, action errors routed to `ServerTelemetryToken#onWebSocketActionFailed`, connect/disconnect events on the returned handle                                                                                                                                                                                                                                                                                                                                                                                                  |
| `@furystack/i18n`                                      | Migrated — `I18NService<TKeys>` interface (extends `EventHub<I18NServiceEvents>`), `I18NServiceImpl<TKeys>` class exported for direct instantiation, `defineI18N<TKeys>(default, ...additional)` mints an app-specific singleton token. No shared library token, no `useI18N` helper                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@furystack/filesystem-store`                          | Migrated — `defineFileSystemStore<T, PK>({name, model, primaryKey, fileName, tickMs?})` returns `StoreToken<T, PK>`. `useFileSystemStore` + its spec deleted. Disposal (tick interval, watcher, final flush) handled via `defineStore`'s `onDispose` hook                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `@furystack/mongodb-store`                             | Migrated — `MongoClientFactory` is now an exported interface + `defineService` singleton token (pools `MongoClient` per URL, closes all on injector dispose). `EventHub` surface dropped (was unused). `defineMongoDbStore<T, PK>({name, model, primaryKey, url, db, collection, options?})`. `useMongoDb` deleted                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `@furystack/sequelize-store`                           | Migrated — `SequelizeClientFactory` → interface + `defineService` singleton token with `JSON.stringify(options)`-keyed pool. `defineSequelizeStore<T, M, PK>({name, model, sequelizeModel, primaryKey, options, initModel?})`. `useSequelize` deleted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `@furystack/redis-store`                               | Migrated — `defineRedisStore<T, PK>({name, model, primaryKey, client})`. Caller retains client lifecycle (connect/quit). `useRedis` deleted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@furystack/auth-jwt`                                  | Migrated — `JwtAuthenticationSettings` interface + singleton token (default factory throws), `RefreshTokenStore` + `RefreshTokenDataSet` throw-by-default, `JwtTokenService` interface + singleton token with `onDispose` system-scope teardown, `useJwtAuthentication(i, {secret, ...})` uses `bind` + `invalidate`, actions switched to `injector.get`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `@furystack/auth-google`                               | Migrated — `GoogleAuthenticationSettings` interface + singleton token (default throws), `GoogleLoginService` interface + singleton token (shared `OAuth2Client`, `onDispose` system-scope teardown, optional `getUserFromGooglePayload` override surface), `useGoogleAuthentication(i, {clientId, ...})` binds settings, `createGoogleLoginAction` switched to `injector.get`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `@furystack/entity-sync-service`                       | Migrated — `SubscriptionManager` interface + singleton token (class-behind-token), `registerModel(dataSetToken, options?)` derives `modelName` from `dataSetToken.model.name`, sync actions are plain `WebSocketAction` descriptors (`SyncSubscribeAction`/`SyncUnsubscribeAction`), integration spec now uses `useWebSocketApi` + the existing `listening` await (no `ServerManager.getOrCreate`)                                                                                                                                                                                                                                                                                                                                                                                |
| `@furystack/entity-sync-client`                        | Migrated — `EntitySyncService` class drops `@Injectable`, `defineEntitySyncService(opts)` mints a per-app singleton token (pattern shared with `defineI18N`), shades helpers moved to `createSyncHooks(syncToken)` returning `{useEntitySync, useCollectionSync}` hooks. `Constructable` import moved to `@furystack/core` (new `@furystack/core` dep added)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `@furystack/shades`                                    | Migrated — all services converted to plain-object factories + tokens (`LocationService`, `LocationServiceSettings`, `RouteMatchService`, `ScreenService`, `SpatialNavigationService`, `SpatialNavigationSettings`). `useCustomSearchStateSerializer` + `configureSpatialNavigation` switched to `bind`+`invalidate`. `Constructable` import moved to `@furystack/core` (new workspace dep). `shade.ts` fallback injector kept (tests rely on non-DI component factories), `hasInjectorReference` call inlined as a safer `props.injector instanceof Injector` check. Specs mechanical-renamed to `createInjector`/`.get(...)`; `useCustomSearchStateSerializer` + `configureSpatialNavigation` specs updated to verify rebind semantics instead of the removed throw-on-late-call |
| `@furystack/shades-common-components`                  | Migrated — `ThemeProviderService`, `NotyService` declassed to plain-object factories (`EventHub` kept via composition); `LayoutService` declassed with throw-by-default scoped token + `createLayoutService()` helper (`<PageLayout>` binds on `createScope`). `FormService` declassed — new `FormContextToken: Token<FormService \| null, 'scoped'>` defaulting to `null` replaces every `injector.cachedSingletons.has(FormService)` call in input components; `<Form>` creates its own scope and binds the token. `SuggestManager`/`CommandPaletteManager` dropped `@Injectable` (kept as plain classes — they're `new`'d in component bodies, never DI-resolved). All `createChild`/`setExplicitInstance` migrated to `createScope`/`bind`                                    |
| `@furystack/shades-mfe`                                | Migrated — `createChild(...)` → `createScope(...)` in `createShadesMicroFrontend` and `MicroFrontend`. Spec `createChildSpy` renamed to `createScopeSpy`. No other surface changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `@furystack/shades-i18n`                               | Migrated — `create-i18n-component.spec.tsx` fixed to import `I18NServiceImpl` (tier-2 carryover from the i18n declass of `I18NService` to a type). No runtime API changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `@furystack/shades-nipple`, `@furystack/shades-lottie` | Migrated — no DI usage; built cleanly against the new `@furystack/shades` exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `@furystack/shades-showcase-app`                       | Migrated — all `getInstance` → `get` call sites mechanically rewritten. `GridPageService` converted from `@Injectable`/`@Injected` class to `defineService` factory using module-scoped `defineStore`/`defineDataSet` tokens and `useSystemIdentityContext` for the seed scope. `themes.tsx` dropped its per-block child-injector dance (global `ThemeProviderService` with per-wrapper CSS-variable scoping is functionally equivalent now that the service is a singleton behind a token). Root `shadesInjector` uses `createInjector()`                                                                                                                                                                                                                                        |

**Combined test count:** tier-1/2 1528 (unchanged); tier 3 adds Shades project 3734 passing across 127 files. Total passing suites after tier 3: **5262**. `@furystack/mongodb-store` / `@furystack/redis-store` still need a real backend; `@furystack/sequelize-store` needs a working native `sqlite3` (unchanged pre-existing CI concern).

## Locked-in design decisions (don't re-litigate)

### DI patterns

- `defineService({ name, lifetime, factory })` — `singleton` / `scoped` / `transient`
- `defineServiceAsync` — for async factories
- `defineStore({ name, model, primaryKey, factory })` → `StoreToken<T, PK>` carrying `model` + `primaryKey` metadata
- `defineDataSet({ name, store, settings? })` → `DataSetToken<T, PK>` (single-argument form with `NoInfer` on settings). Type-widening gotcha: inline callbacks in `settings` widen `TPrimaryKey` to `keyof T`; annotate `entity` explicitly or use `entity.value!` when it happens
- **No decorators** (`@Injectable`, `@Injected` don't exist in current `@furystack/inject`)
- `Injector` API: `get(token)`, `getAsync(token)`, `bind(token, factory)`, `invalidate(token)`, `createScope(opts?)`, `[Symbol.asyncDispose]()`
- `createInjector()` for root; `usingAsync(createInjector(), async (i) => {...})` for tests
- No `createChild` — it's `createScope`
- No `setExplicitInstance` — it's `bind` + (optionally) `invalidate`
- No `getInstance` — it's `get`
- No `cachedSingletons` — use `invalidate(token)` in tests that need cache reset

### Stores & datasets

- **Persistent data stores throw by default.** Apps must `injector.bind(SomeStore, () => persistentImpl)` before resolving anything that depends on them. Tests opt into `InMemoryStore` explicitly per injector.
- Callers pass `DataSetToken` (not `{model, primaryKey}`) to endpoint generators and `getDataSetFor`.

### Lifecycle

- System-identity scopes created via `useSystemIdentityContext({ injector, username })` — caller is responsible for disposal (usually via `onDispose` inside a factory, or `usingAsync`).
- Service factories register teardown with `ctx.onDispose(async () => ...)`.
- Disposable linting rule (`furystack/prefer-using-wrapper`) flags `instance[Symbol.dispose]()` inside factories — acceptable pattern when paired with `onDispose`, disable with an `eslint-disable-next-line` comment + reason.

### Scope lifetimes (rules of thumb)

- Config singletons (settings, policies): `singleton`
- Per-app state that should isolate per-test: `scoped`
- Per-request state (user context, scope-local DataSets): `scoped`
- `transient` is rarely what you want

### Type-inference gotchas

- `defineStore`, `defineDataSet` and every `defineXxxStore` helper (`defineFileSystemStore`, `defineMongoDbStore`, `defineRedisStore`, `defineSequelizeStore`) use `<T, const TPrimaryKey extends keyof T>`. TypeScript collapses `TPrimaryKey` back to `keyof T` whenever the call sits inside another helper or arrow function. **Fix:** pass explicit generics at the call site (e.g. `defineStore<T, TPrimaryKey>({...})`, `defineFileSystemStore<TestClass, 'id'>({...})`) or declare the token at module scope with an explicit `StoreToken<T, PK>` / `DataSetToken<T, PK>` annotation.
- `defineDataSet`'s single-argument form: callback contextual typing still widens `TPrimaryKey` → use an explicit triple generic `defineDataSet<T, 'pk', WithOptionalId<T, 'pk'>>({...})` in spec helpers where this happens.
- When binding `IdentityContext` in specs with a `getCurrentUser` mock, type it `<TUser extends User>() => Promise.resolve({...} as unknown as TUser)` — the generic call-signature doesn't narrow from a concrete `User` return.

## Migration order (dependency-driven)

Work through these packages in order. Each depends only on already-migrated ones.

### Tier 1 — DONE

1. ~~**`@furystack/websocket-api`**~~ — done, see status table
2. ~~**`@furystack/filesystem-store`**~~ — done
3. ~~**`@furystack/mongodb-store`**~~ — done
4. ~~**`@furystack/redis-store`**~~ — done
5. ~~**`@furystack/sequelize-store`**~~ — done
6. ~~**`@furystack/i18n`**~~ — done

### Tier 2 — DONE

7. ~~**`@furystack/auth-jwt`**~~ — done, see status table
8. ~~**`@furystack/auth-google`**~~ — done
9. ~~**`@furystack/entity-sync-service`**~~ — done
10. ~~**`@furystack/entity-sync-client`**~~ — done (no shades dep at runtime — the `shades-hooks` module is duck-typed against a `SyncHookContext`)

### Tier 3 — DONE

11. ~~**`@furystack/shades`**~~ — done, see status table
12. ~~**`@furystack/shades-common-components`**~~ — done
13. ~~**`@furystack/shades-mfe`**~~, ~~**`shades-nipple`**~~, ~~**`shades-i18n`**~~, ~~**`shades-lottie`**~~ — done
14. ~~**`@furystack/shades-showcase-app`**~~ — done

### Tier 4 — tooling

15. **`@furystack/eslint-plugin`** — `injectable-consistent-inject` deleted alongside the `HttpUserContext.user` fix (TS already flags every removed API). Remaining rules (`prefer-using-wrapper`, `no-direct-physical-store`) still in use — re-verify after the shades tier lands.

### Tier 5 — post-migration cleanup — DONE

Release-prep sweep across docs, rules, skills, the eslint plugin, jsdocs, and changelog drafts for the `0f602aaa` (functional DI) release. Each box = one commit in the tier-5 PR; order preserves the "rules first so any future work uses the updated guidance, changelogs last so they can link the shared guide" flow.

- [x] **Cursor rules rewritten** — `.cursor/rules/LIBRARY_DEVELOPMENT.md` fully rewritten for functional DI (`defineService`, `defineStore`, `defineDataSet`, `createInjector`, `get`/`bind`/`invalidate`/`createScope`, scope caching gotcha, `useSystemIdentityContext`). Surgical edits in `TESTING_GUIDELINES.md`, `CODE_STYLE.mdc`, `TYPESCRIPT_GUIDELINES.mdc`, `.cursor/rules/README.md`. `VERSIONING_AND_CHANGELOG.md` gained an "Exception: shared release-wide migration guide" clause so per-package major entries may link out to `docs/migrations/*.md` + list API deltas.
- [x] **Cursor skill `review-changes` updated** — DI bullet and "ESLint rule opportunities" hints now reference `defineService`/`defineStore`/`defineDataSet`/`bind`/`invalidate`/`createScope`/`useSystemIdentityContext` instead of the removed `@Injectable`/`@Injected`. `fill-changelog` skill left as-is (already general).
- [x] **ESLint plugin rule rename** — `no-direct-physical-store` deleted (the `StoreManager` import it banned no longer exists). New rule `no-direct-store-token` structurally detects `injector.get(StoreToken)` / `injector.getAsync(StoreToken)` in application code via `type-services.matchesType`-style structural checks. `recommended` / `recommendedStrict` configs updated. `typed-rules.spec.ts` trimmed of the old rule's typed cases; the new rule has its own spec covering store vs data-set vs plain-service detection and the allow-list.
- [x] **Package READMEs updated (15 files + root)** — every outdated code block replaced with new-API equivalents. Length, tone, and prose preserved; no new sections added. Root `README.md` blurb for `@furystack/core` no longer mentions "store managers". See commit diff for the exact set.
- [x] **JSDoc / source-comment sweep** — ran `rg '@Injectable|@Injected|getInstance|setExplicitInstance|createChild|addStore|getRepository|StoreManager|cachedSingletons|hasInjectorReference'` across `packages/**/src/**/*.{ts,tsx}`. No live API references left. The only remaining mentions are historical-archaeology comments inside `rest-service/server-telemetry.ts`, `proxy-runtime.ts`, and `rest-api-runtime.ts` that explain where the code moved from (e.g. "Moved out of the deleted `ApiManager.onMessage` verbatim"). Kept — they describe history, not current API.
- [x] **Shared migration guide written** — `docs/migrations/v7-functional-di.md`. Sections: prerequisites → core concept → global API deltas table → per-package deltas → common migration recipes → pitfalls → testing checklist. Every package CHANGELOG draft links back to it with a relative path. Distilled from this plan file, reoriented for package consumers.
- [x] **Changelog drafts filled (30 files)** — `.yarn/changelogs/@furystack-*.0f602aaa.md` + `furystack.0f602aaa.md`. Each per-package entry is a short `💥 Breaking Changes` section with a guide link + the package's API deltas (no `Testing Checklist` / `Common Issues` boilerplate per package). The meta `furystack` draft lists every bumped package and highlights the Node ≥ 22 requirement. `yarn changelog check` passes (30/30 valid).
- [x] **Plan doc update (this section)** — Tier 5 checklist added. Decisions captured in-line rather than a separate doc.

### Tier-5 decisions (for future releases that do a similar sweep)

- **Shared migration guide** lives in `docs/migrations/vX-name.md`. Relative links from `.yarn/changelogs/*.md` end up as `../../docs/migrations/...` — stable, no new top-level files required per release.
- **Per-package CHANGELOG entries** are short API-delta lists + a guide link. The `VERSIONING_AND_CHANGELOG.md` "Exception" clause documents this pattern; the validator only cares that the `💥 Breaking Changes` section has content.
- **ESLint rule renames are breaking changes for downstream consumers of `@furystack/eslint-plugin`.** Documented in the plugin's changelog with the new rule name and a note to update `eslint.config.js`.
- **`no-direct-store-token` detection** uses structural type-checking (`getProperty('model') && getProperty('primaryKey') && getProperty('id') && getProperty('factory')`). This catches both explicit `StoreToken<T, PK>` annotations and inferred tokens from `defineStore` without requiring a marker brand. The allow-list preserves the old rule's semantics verbatim.
- **READMEs stay surgical.** Blanket rewrites lose useful domain prose. Only replace outdated code blocks (and the prose inline-referencing them); don't add new sections as part of a release-prep sweep.
- **Scope sweeps by grep narrow** — prose comments only, not all code — once migration code is already rewritten. Otherwise the sweep drowns in `usingAsync(new Injector(), ...)` spec hits that are still perfectly valid.

## Per-package guidance

### 1. websocket-api — DONE

**Shipped shape (deviated from original plan — see "findings" below):**

- `WebSocketApi` is an **interface** extending `EventHub<WebSocketApiEvents>` with `socket`, `serverApi`, `broadcast(cb)`. **No DI token** — `useWebSocketApi(...)` returns the handle directly (same shape as `useRestService` returning `ServerApi`). Multi-endpoint capable on a single injector.
- **No `WebSocketApiSettings` token.** Inline options on `useWebSocketApi({ injector, port, hostName?, path?, actions? })`.
- `WebSocketAction` is a plain object `{ canExecute(ctx): boolean; execute(ctx & { injector }): Promise<void> }`. No decorators, no static members, no per-instance lifecycle.
- Action failures → `ServerTelemetryToken#onWebSocketActionFailed` (new event). Per-socket connect/disconnect events stay on the returned handle.
- `injector.createScope({ owner: message })` creates a **per-connection** scope on `connection`. A further **per-message** scope is created inside `execute` and disposed in `finally` — mirrors the rest-service per-request scope pattern so scoped services (`HttpUserContext`) resolve fresh for every message.
- `IdentityContext` binding is lazy inside the message scope: the bind factory only resolves `HttpUserContext` when an action requests `IdentityContext`. Actions that never touch auth don't force auth stores to be configured.
- Cleanup uses a private scoped token (`WebSocketApiCleanupRegistry`) — see findings.

### 2-5. Store adapters (filesystem-store / mongodb-store / redis-store / sequelize-store) — DONE

**Shipped shape**

- Each backend package exports `defineXxxStore<T, PK>(opts): StoreToken<T, PK>` that wraps `defineStore` and instantiates the concrete store in the factory. Old `useXxxStore(injector, ...)` side-effect helpers + their dedicated specs were deleted.
- Stateful client factories (`MongoClientFactory`, `SequelizeClientFactory`) were converted from `@Injectable({lifetime:'singleton'})` classes to `defineService({lifetime:'singleton'})` tokens. Each factory keeps its internal `Map<key, Client>` pool and registers an `onDispose` to close every pooled client when the owning injector is disposed. Both factory tokens are exported so tests (and advanced integrations) can reach raw clients — e.g. the mongo spec still resolves the factory to drop the test database.
- The mongo factory's previous `EventHub<{onClientCreated, onDisposed}>` surface was dropped (zero in-repo consumers). The spec tests for those events went away with it.
- `FileSystemStore` disposal (tick interval, fs watcher, final flush) is now driven by `defineStore`'s built-in `onDispose` hook — no extra wiring per helper.
- Redis keeps its user-provided-client contract: the app connects and quits the `redis` client, the store just reads/writes through it.
- Backend integration specs are unchanged in intent — they still need a live Mongo / Redis. Sequelize-store runs fully offline via `dialect: 'sqlite', storage: ':memory:'`.

### 6. i18n — DONE

**Shipped shape**

- `I18NService<TKeys>` is now an exported interface that extends `EventHub<I18NServiceEvents>`. The concrete `I18NServiceImpl<TKeys>` class stays exported for direct-instantiation tests (`new I18NServiceImpl(en, de)` inside `using(...)`).
- `defineI18N<TKeys>(defaultLanguage, ...additionalLanguages): Token<I18NService<TKeys>, 'singleton'>` mints a per-app token. Apps declare it once at module scope — inlining defeats singleton caching (same hazard as `defineStore`).
- Factory registers `onDispose(() => service[Symbol.dispose]())` so listener cleanup runs on injector teardown. `useI18N` helper deleted — the token self-registers, so no setup function is needed.
- No shared library-level token: `TKeys` is application-specific, so library-level interning would erase the key-level type safety.

### 7. auth-jwt — DONE

**Shipped shape**

- `JwtAuthenticationSettings` is an **interface** + singleton token; default factory throws `JwtAuthenticationNotConfiguredError` so callers must run `useJwtAuthentication` first. `defaultJwtAuthenticationSettings()` provides the non-secret defaults. Overrides accept a `Partial<FingerprintCookieSettings>` that is shallow-merged with the defaults (no need to pass a full cookie settings object).
- `RefreshTokenStore: StoreToken<RefreshToken, 'token'>` + `RefreshTokenDataSet` are **throw-by-default** (pattern mirrored from security). Apps must bind a persistent implementation before resolving `JwtTokenService`. `JwtStoreNotConfiguredError` wraps the failure message.
- `JwtTokenService` is an interface + singleton token. Factory injects settings + `RefreshTokenDataSet`, captures a single system-identity child scope (`useSystemIdentityContext`) and registers `onDispose` to release it. Closure-based methods replace the old private fields.
- `useJwtAuthentication(i, {secret, ...})` validates the secret length, `bind(JwtAuthenticationSettings) + invalidate(JwtAuthenticationSettings, JwtTokenService)`, then resolves `HttpAuthenticationSettings` + `JwtTokenService` and appends the JWT bearer provider to the existing chain.
- Actions (`jwt-login-action`, `jwt-logout-action`, `jwt-refresh-action`) switched to `injector.get(...)`. The refresh action now looks up `HttpAuthenticationSettings#userDataSet` inside a short-lived system scope (matches the new rest-service pattern; the old `HttpUserContext.getUserDataSet()` helper is gone).
- All specs rewritten to use `injector.bind(UserStore, ...)`, `usePasswordPolicy`, `useHttpAuthentication`, `useJwtAuthentication`, and `injector.get(...)`. 143 tests pass.

### 8. auth-google — DONE

**Shipped shape**

- `GoogleAuthenticationSettings` is an **interface** + singleton token with a throw-by-default factory (`GoogleAuthenticationNotConfiguredError`). Fields: `clientId` (required), `enableCsrfCheck` (defaults to `false`), optional `getUserFromGooglePayload` override.
- `GoogleLoginService` is an interface + singleton token. Factory resolves settings + `HttpAuthenticationSettings`, captures a system-identity scope (`onDispose` teardown), instantiates a single `OAuth2Client` reused across token verifications, and installs a default user resolver that looks up the user by verified `email` against the configured `userDataSet`.
- `useGoogleAuthentication(i, {clientId, ...})` validates `clientId`, `bind(GoogleAuthenticationSettings) + invalidate(GoogleAuthenticationSettings, GoogleLoginService)`. No provider push — Google auth is login-only.
- `createGoogleLoginAction(strategy)` switched to `injector.get(GoogleLoginService)`. CSRF double-submit cookie check is still driven off `service.enableCsrfCheck`.
- Specs rewritten; the login-action spec now `injector.bind(GoogleLoginService, () => mock)` to substitute mocks — much cleaner than the old `setExplicitInstance(new GoogleLoginService(), ...)` dance. 33 tests pass.

### 9. entity-sync-service — DONE

**Shipped shape**

- `SubscriptionManager` is an interface + singleton token, backed by a `SubscriptionManagerImpl` class (the state is complex enough that a class-behind-token is cleaner than a closure-only factory). Factory creates a dedicated system-identity child scope used for DataSet resolution and event subscriptions; `onDispose` disposes the manager and the scope.
- `registerModel(dataSetToken, options?)` replaces the old `(model, primaryKey, options?)` signature. Wire `modelName` is still `dataSetToken.model.name`, `primaryKey` is pulled off the token's metadata — callers no longer pass both. `EntitySyncModelConfig` now holds `{dataSet: DataSetToken<unknown, never>} & ModelSyncOptions`.
- `useEntitySync(injector, {models: [...]})` resolves the manager via `injector.get` and registers each dataset token. Must be called after the stores backing those datasets are bound.
- `SyncSubscribeAction` and `SyncUnsubscribeAction` are now plain `WebSocketAction` descriptor constants (`{canExecute, execute({injector, ...})}`). `execute` calls `injector.get(SubscriptionManager)` on the per-message scope provided by `useWebSocketApi` — no `getInjectorReference(this)`.
- Integration spec rewritten against `useWebSocketApi` + `injector.bind(...)` for stores; the old `ServerManager.getOrCreate` wait is gone (the existing `useWebSocketApi` already awaits `listening`). 60 tests pass (41 unit + 19 integration).

### 10. entity-sync-client — DONE

**Shipped shape**

- `EntitySyncService` drops the `@Injectable({lifetime: 'explicit'})` decorator — it was a no-op at runtime, the class constructor was already exposed. Constructor remains public so tests and non-DI integrations keep using `new EntitySyncService(opts)`.
- `defineEntitySyncService(options): Token<EntitySyncService, 'singleton'>` mints a per-app token. Same pattern as `defineI18N` — options are app-specific so library-level interning would erase type safety. Factory instantiates the service once and registers `onDispose` for `Symbol.dispose`.
- Shades helpers moved to a `createSyncHooks(syncToken)` factory returning `{useEntitySync, useCollectionSync}` hooks bound to the caller-supplied token. Apps declare the token + hooks together at module scope and reuse them across components.
- `Constructable` import moved from `@furystack/inject` (where it no longer lives) to `@furystack/core`, which required adding `@furystack/core` as a direct dependency.
- No runtime coupling to `@furystack/shades`: `SyncHookContext` is duck-typed (`injector`, `useDisposable`, `useObservable`), so the package stayed out of tier 3. README examples still reference shades.
- Specs rewritten to use `createSyncHooks(defineService({...}))` with mock WebSocket factories and `injector.get(syncToken)`; test helper mints a fresh token per test so the singleton cache doesn't leak between cases. 95 tests pass.

### 11. shades — DONE

**Shipped shape**

- **All four services plain-object factories.** `LocationService`, `RouteMatchService`, `ScreenService`, `SpatialNavigationService` are now `interface` + `defineService(...)` singleton tokens. No class exports. Factory closures hold state; `onDispose` handles teardown (event listeners, observable disposal, history.pushState / replaceState restoration).
- **Settings tokens for configurable services.** `LocationServiceSettings` and `SpatialNavigationSettings` default to sensible factories; `useCustomSearchStateSerializer(injector, serialize, deserialize)` and `configureSpatialNavigation(injector, options)` switch to `bind(settings) + invalidate(settings, service)`. The old "must be called before first resolve" throw-guard is gone (the previous `injector.cachedSingletons.has(...)` escape hatch no longer exists); calling these helpers after first resolve silently rebinds — listeners on the old instance leak until the injector is disposed (acceptable per the `useJwtAuthentication` precedent).
- **`shade.ts` kept the `new Injector()` fallback** in the injector getter. Removing it breaks ~20 existing spec cases that render components without a DI context. Added as a follow-up instead (see below).
- **`Constructable` import moved to `@furystack/core`** (tier-1 pattern repeats). `@furystack/shades` gained a direct `@furystack/core` workspace dep.
- **`hasInjectorReference` is gone from `@furystack/inject`.** The `.injector` prop discovery in `shade.ts` now inlines a safer `(this.props as {injector?: unknown})?.injector instanceof Injector` check.

### 12. shades-common-components — DONE

**Shipped shape**

- **`LayoutService` is now a throw-by-default scoped token** + exported `createLayoutService(targetElement?)` factory. `<PageLayout>` creates `injector.createScope({ owner: 'page-layout' })`, instantiates the service via `createLayoutService()`, and `scope.bind(LayoutService, () => instance)`. Descendants (`<Drawer>`, `<DrawerToggleButton>`) still resolve via `injector.get(LayoutService)`.
- **`FormService` dual-token design.** `FormService` is an interface; `createFormService<T>()` returns a plain-object instance; `FormContextToken: Token<FormService | null, 'scoped'>` defaults to `null`. `<Form>` creates a scope and binds `FormContextToken` with the created instance. Every input component that used `injector.cachedSingletons.has(FormService) ? injector.getInstance(FormService) : null` now does `injector.get(FormContextToken)` (returns `null` outside a form). Fixes the gap left by removing `cachedSingletons` from the injector surface.
- **`ThemeProviderService` / `NotyService` declassed with composition.** Both services extend `EventHub` today; the new factory allocates a private `EventHub` and returns it via `Object.assign(hub, {...publicMethods})` casted to the interface. Keeps `emit`/`subscribe`/`addListener` working without resorting to delegation boilerplate.
- **`SuggestManager` / `CommandPaletteManager` dropped `@Injectable`.** They're never resolved from the injector — always `new`'d inside a `useDisposable` hook. No token, no factory. Added to the "review remaining classes" follow-up (they still extend `EventHub`).

### 13. shades-mfe / shades-i18n / shades-nipple / shades-lottie — DONE

**Shipped shape**

- **`shades-mfe`:** `createChild(...)` → `createScope(...)` in `createShadesMicroFrontend` and `MicroFrontend`. Spec asserts `createScopeSpy` instead of the removed `createChildSpy`.
- **`shades-i18n`:** fixes the tier-2 follow-up — `create-i18n-component.spec.tsx` now imports `I18NServiceImpl` (the concrete class exported from `@furystack/i18n`) rather than treating `I18NService` (interface) as a constructable value.
- **`shades-nipple`, `shades-lottie`:** zero DI surface area; rebuild cleanly.

### 14. shades-showcase-app — DONE

**Shipped shape**

- **`GridPageService` full migration.** Converted from `@Injectable({lifetime:'singleton'})` class + `@Injected` property to `defineService({lifetime:'singleton'})` factory. Module-scope `GameItemStore` (via `defineStore` with an `InMemoryStore` factory) and `GameItemDataSet` (via `defineDataSet`) replace the old `addStore` + `getRepository().createDataSet()` calls. Factory owns a `useSystemIdentityContext` scope and disposes it via `onDispose`.
- **`themes.tsx` simplified.** The old per-block `createChild() + setExplicitInstance(new ThemeProviderService())` dance is gone — the global `ThemeProviderService` singleton only emits CSS variables (the block's visual isolation comes from applying those variables to the block's wrapper ref), so one service instance is functionally equivalent now that the service is token-backed.
- **Root bootstrap cleanup.** `shadesInjector = createInjector()` and the eager `shadesInjector.get(ThemeProviderService)` / `get(SpatialNavigationService)` resolves replace the old `new Injector()` + `getInstance` form. Every other call site is a mechanical `.getInstance(X)` → `.get(X)` rewrite.

### 15. eslint-plugin

- `injectable-consistent-inject` rule deleted (old `@Injectable`/`@Injected` decorators no longer exist; TS already enforces the remaining patterns)
- `prefer-using-wrapper` rule stays — already in use
- `no-direct-physical-store` rule — check relevance after repository migration

## Standard workflow per package

For each package, follow the same loop:

1. **Explore:** read sources to find `@Injectable`, `@Injected`, `getInstance`, `setExplicitInstance`, `createChild`, `getRepository`, `addStore`, `StoreManager` usages
2. **Propose:** list the class-to-token mappings, new helpers, deprecations; ask for confirmation on non-obvious design choices (store defaults, scope lifetimes, breaking signatures)
3. **Implement:** in dep order within the package — foundation types first (settings, tokens), then consumer classes, then helpers, then specs
4. **Delete old files** once replacements are in place
5. **Verify:**
   - `rm -f packages/<pkg>/tsconfig.tsbuildinfo`
   - `yarn workspace @furystack/<pkg> run build`
   - `yarn exec eslint packages/<pkg>/src`
   - `yarn exec vitest run --project <Common|Service> packages/<pkg>`

### Out of scope for migration PRs

Do **not** touch any of these as part of a migration change — they are handled in a separate follow-up release ticket:

- `package.json` `version` fields
- `CHANGELOG.md` entries (new `## [x.y.z]` sections, version headers, migration notes)
- `README.md` usage examples

Breaking changes documented in code comments, spec coverage and the plan status table are enough for the migration PR. The follow-up ticket batches version bumps, changelog entries and README refreshes across the touched packages in one pass so versioning stays consistent.

## Common pitfalls encountered so far

- **Eager `inject(X)` in factory where X is only needed sometimes** — causes store-not-configured failures for tests that don't exercise auth paths. Fix: pass `() => injector.get(X)` to the impl and resolve lazily. (Happened in `HttpUserContext`/`PasswordAuthenticator` chain.)
- **`Object.assign(token, {meta})` doesn't always narrow** — declare the result with explicit annotation: `const result: StoreToken<T, PK> = Object.assign(...)` then `return result`.
- **`const` type parameter** needed on generics that accept literal keys (e.g. `<T, const TPrimaryKey extends keyof T>`)
- **`useSystemIdentityContext` scopes leak** if created outside a factory. Mostly harmless for singleton setups; in per-request factories register `onDispose(() => scope[Symbol.asyncDispose]())`
- **Pre-migration `init(injector)` methods were NOT dead.** `Injector.getInstance` auto-called `init(injector)` on every freshly constructed singleton that exposed one (PR #329). v7 has no equivalent. Don't drop these methods based on a grep for callers — the injector was the implicit caller. Correct migration path depends on the shape of the init:
  - **Sync setup** (subscribe to window events, build caches in memory) → fold the body into the `defineService` factory.
  - **Async setup** (seed store, fetch config, connect to remote) → convert the whole service to `defineServiceAsync`, `await` the setup inside the factory, resolve via `injector.getAsync(Token)` at the consumer. Pass the resolved instance into the consuming component as an explicit prop; route-level `<LazyLoad>` loaders are the right place to own the async boundary.
  - **Do not** keep a public `init()` method and ask consumers to call it — that leaks lifecycle into every call site and silently breaks if a consumer forgets.

  The only service in this repo that actually depended on the auto-call was `GridPageService`, which now ships as `defineServiceAsync` and is the reference implementation of the pattern (see Tier-3 findings).

- **Spec helper functions widen generic return types** — declare stores/tokens at module scope, or annotate the function's return type explicitly
- **Test-scoped `InMemoryStore` binding pattern:**

  ```ts
  i.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))
  ```

  repeat for each throw-by-default store the test path exercises

- **Scoped tokens cached on the root are visible to descendants (big gotcha).** `findCached` walks the scope parents. If a setup step does `injector.get(HttpUserContext)` on the root, every descendant scope resolution returns the same cached instance. Any state stored on the instance itself is therefore shared across per-connection / per-message scopes. Mitigations:
  1. Perform setup/login/logout inside a short-lived child scope (`usingAsync(injector.createScope(...), async (setup) => { setup.get(HttpUserContext).cookieLogin(...) })`) so the scoped instance is cached on the disposable child, not on the root. Still the safer option for auth-related setup.
  2. When consumer code needs per-message freshness, create a nested scope for every "request" (`connectionInjector.createScope({ owner: data })`) and resolve scoped services on it — but this only helps if no ancestor has already cached the token.
  3. Inside the service itself, store per-request state in a `WeakMap<object, ...>` keyed by the incoming request's `headers` (or any other per-request identity) rather than on the instance. This is the pattern the rest-service `HttpUserContext.userCache` uses after the follow-up fix — even when the same instance is reused across scopes, cache entries stay isolated because every request has its own headers object.

- **Registering disposal from outside a factory context.** `ServiceContext.onDispose` is only available inside `defineService` factories, but `useXxx` helpers don't run in a factory. The pattern introduced in websocket-api:

  ```ts
  const CleanupRegistry: Token<Set<() => Promise<void>>, 'scoped'> = defineService({
    name: '.../CleanupRegistry',
    lifetime: 'scoped',
    factory: ({ onDispose }) => {
      const cleanups = new Set<() => Promise<void>>()
      onDispose(async () => {
        const pending = [...cleanups]
        cleanups.clear()
        await Promise.allSettled(pending.map((c) => c()))
      })
      return cleanups
    },
  })

  // inside a helper
  const cleanups = injector.get(CleanupRegistry)
  cleanups.add(() => disposeMyResource())
  ```

  Works because the injector disposes callbacks in **reverse registration order**: `useXxx` resolves the pool/telemetry first, the registry second, so the registry's `onDispose` fires _before_ the pool's — letting consumer cleanup run while the pooled `http.Server` is still open.

- **Plan recommendations are starting points, not prescriptions.** The original plan's "target shape" for websocket-api included a `WebSocketApi` scoped token and a `WebSocketApiSettings` singleton token — both were dropped after review because they conflicted with multi-endpoint support and with the `useRestService` style already established. Future per-package sections should be treated the same way: read them, then grill before coding.

- **Downstream packages may be broken by the migration and that's fine.** `@furystack/entity-sync-service` stopped building once rest-service migrated (still references `@Injectable`, `getInstance`, `ServerManager`, `getRepository`); it remains red after the websocket-api migration because the `WebSocketAction` shape changed. These breakages are expected — each downstream package is migrated in its own tier. Don't patch them temporarily in the upstream PR.

- **Tier-1 finding: `Constructable` import path.** `Constructable` now lives in `@furystack/core`, not `@furystack/inject` (the move happened during the core migration). Every store adapter needed its import updated — build errors for the store classes looked like "Module `@furystack/inject` has no exported member `Constructable`".

- **Tier-1 finding: `defineStore` generic widening inside wrappers.** When a helper like `defineFileSystemStore<T, const TPrimaryKey extends keyof T>({...})` forwards its generics into `defineStore({...})`, TS collapses `TPrimaryKey` to `keyof T` unless you pass explicit generics: `defineStore<T, TPrimaryKey>({...})`. Same for the concrete store constructor — `new FileSystemStore<T, TPrimaryKey>({...})` is required. Downstream: callers must also pass explicit generics, e.g. `defineFileSystemStore<TestClass, 'id'>({...})`. Same shape as the `defineDataSet` gotcha already documented.

- **Tier-1 finding: client-factory conversion recipe.** `@Injectable({lifetime:'singleton'}) class Factory implements AsyncDisposable` with an internal `Map<key, Client>` pool + `Symbol.asyncDispose` converts directly to:

  ```ts
  export const Factory: Token<Factory, 'singleton'> = defineService({
    name: '.../Factory',
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const connections = new Map<string, Client>()
      onDispose(async () => {
        await Promise.all([...connections.values()].map((c) => c.close()))
        connections.clear()
      })
      return { getClientFor(...) { /* ... */ } }
    },
  })
  ```

  The interface + `const Factory` (same name) idiom is the same pattern used by `HttpUserContext`, `LoggerRegistry`, etc.

- **Tier-1 finding: dropping dead `EventHub` surfaces is safe and cheaper.** `MongoClientFactory` had a never-subscribed-to `EventHub<{onClientCreated, onDisposed}>`. Removing it shrank the migration (no factory-as-EventHub, no extension-of-class) and deleted two specs that only existed to exercise the dead surface. Repeat the grep before the next factory migration.

- **Tier-1 finding: generic-per-app tokens cannot be shared.** `I18NService<TKeys>` can't be interned at library scope because each app's `TKeys` literal union differs. The pattern `defineI18N<TKeys>(...)` returns a fresh per-app token and preserves key-level type safety. Applies to any future service with call-site literal generics (translation keys, enum maps, etc.).

## Commit strategy recommendation

One PR per Tier-1/2 package to keep reviews tractable; Tier 3 (shades) can be batched since it's a separate dep tree. Version bumps, CHANGELOG entries and README refreshes are **explicitly out of scope** for these PRs — they are rolled up into a dedicated follow-up release ticket that touches every migrated package at once (see "Out of scope for migration PRs" above).

## Files kept from the old API that may need cleanup later

- `packages/rest-service/src/rest-api-runtime.ts` — still has `getInstance` in grep results because of a comment/doc string; re-verify after next grep sweep
- Legacy `CHANGELOG.md` references — cosmetic only

## Open follow-ups

- ~~**entity-sync-service rot.**~~ Rewritten in tier 2 against the new API (tokens, DataSetToken-based registration, descriptor-style actions).
- ~~**`entity-sync-service` integration spec**~~ rewritten in tier 2 against `useWebSocketApi` — the `ServerManager.getOrCreate` wait is gone.
- ~~**`shades-i18n` downstream breakage.**~~ Fixed in tier 3 — spec now imports `I18NServiceImpl` from `@furystack/i18n`.
- **Test infra for backend stores.** `@furystack/mongodb-store` and `@furystack/redis-store` suites assume a live backend (`MONGODB_URL`, `REDIS_URL`). `@furystack/sequelize-store` needs a working native `sqlite3` binding (the sandbox image currently fails to rebuild it). Flagged so future CI work toggles the live backend suites and rebuilds `sqlite3`.
- **Review remaining classes for potential declassing.** Tier 3 committed to plain-object factories for every new service. Existing classes to audit (low priority, touch only if it simplifies the surface):
  - `@furystack/i18n` — `I18NServiceImpl` (still exported for direct instantiation; declass would push tests through `defineI18N` only).
  - `@furystack/entity-sync-service` — `SubscriptionManagerImpl` (class-behind-token pattern; manager is stateful enough that a class reads fine, but tracked for completeness).
  - `@furystack/shades-common-components` — `SuggestManager`, `CommandPaletteManager` (both extend `EventHub`; declassing requires `EventHub` composition or an `EventHub` declass first).
  - `@furystack/utils` — `EventHub`, `ObservableValue`, `Semaphore`, etc. (library primitives, may never make sense to declass).
  - `@furystack/core` — `InMemoryStore`, `AggregatedError` (physical-store contract is class-shaped today).
  - `@furystack/shades` — `ResourceManager` (internal to `shade.ts`, instantiated per component — not DI-managed).
- **Tier-3 node version caveat.** Running the `Shades` vitest project locally requires Node ≥ 22 (jsdom 29 → `html-encoding-sniffer@6` → `@exodus/bytes` ESM dep). Node 20 throws `ERR_REQUIRE_ESM` when the jsdom environment boots. Engines field already enforces `>=22` but the local sandbox happens to have Node 20 on PATH — run via `~/.nvm/versions/node/v22.21.1/bin/node` or equivalent. No code change required.
- **`@furystack/shades` injector fallback.** `shade.ts` still instantiates a bare `new Injector()` when a component has no parent injector and no `injector` prop. Removing this threw on a pre-existing spec that rendered components without a DI context, so the fallback stays for now — apps should always go through `initializeShadeRoot`. Candidate for a harder throw once every downstream test has been audited.
- **`GridPageService` converted to `defineServiceAsync`.** Earlier notes in this plan incorrectly claimed the legacy page never called `init(injector)`; in fact `Injector.getInstance` auto-invoked `init(injector)` on newly constructed singletons (PR #329), which is how the grid populated on `develop`. The functional-DI rewrite dropped that convention, so the `defineService` factory's `init()` was never triggered and the grid rendered `- No Data -`, failing every `e2e/data-display/grid.spec.ts` test. An interim fix wired `void gridPageService.init()` from `<GridPage>` render; that was rolled forward into the idiomatic shape:
  - `GridPageService` is now a `defineServiceAsync` token. The factory seeds the 100-item store, subscribes `findOptions → updateCollectionService`, and runs the first refresh before resolving. No `init()` method, no readiness flag.
  - `<GridPage>` and `<GridStatus>` accept a `service: GridPageService` prop instead of resolving from `injector.get(...)`.
  - The `/data-display/grid` route's `<LazyLoad>` loader parallelizes the page-chunk import and `shadesInjector.getAsync(GridPageService)` via `Promise.all`, then passes the resolved instance into `<GridPage>`.
  - `routes.tsx` imports `shadesInjector` from `./index.js`; ESM handles the resulting cycle because the reference is only dereferenced inside the lazy loader callback, long after both modules have initialized.

  Grid was the only service in the repo that depended on the auto-call and the only target for this conversion. Future services with async bootstrap should follow the same shape.

## Tier-2 findings

- **Plan was wrong about `entity-sync-client` being blocked on shades.** The package has no runtime `@furystack/shades` dep — `SyncHookContext` is duck-typed, so tier 2 can ship without waiting for tier 3. Updated the tier table accordingly.
- **`@Injectable({lifetime: 'explicit'})` is a no-op at runtime.** `EntitySyncService` was carrying the decorator purely for documentation; removing it changes nothing observable. Likely applies to any remaining `'explicit'` lifetime decorators encountered later.
- **Per-app tokens + hook factories.** `defineEntitySyncService(opts)` + `createSyncHooks(syncToken)` is the same pattern as `defineI18N`. Any future client-side service with per-app configuration (wsUrl, local cache store, etc.) should follow it instead of reaching for a library-level token.
- **Spec refactor: `injector.bind(Token, () => mock)` replaces `setExplicitInstance`.** Cleaner than the old `setExplicitInstance(new X(), X)` dance, matches production DI semantics, plays nicely with `invalidate`. The auth-google login-action spec is the cleanest example.
- **Shallow `fingerprintCookie` merge in `useJwtAuthentication`.** The overrides type explicitly widens `fingerprintCookie` to `Partial<FingerprintCookieSettings>` so callers only write the keys they want to change. Worth copying for any future nested-settings helper.
- **Refresh actions still need their own system scope.** Even after the `HttpUserContext.userCache` fix, `JwtRefreshAction` creates a throwaway `useSystemIdentityContext` child scope for the dataset read because the _caller_ is unauthenticated at refresh time. The ancestor-cache safety only helps when the authenticated-caller scope is already correct.
- **`DataSetToken` carries `model` + `primaryKey` — use it.** `SubscriptionManager.registerModel` used to take `(model, primaryKey, options?)`; accepting a `DataSetToken` directly both simplifies the call sites and eliminates the "which primary key?" footgun. `EntitySyncModelConfig` shape collapsed accordingly. Any future API that used to take `{model, primaryKey}` should follow suit.
- **`Constructable` lives in `@furystack/core`, not `@furystack/inject`.** Same gotcha as the tier-1 store adapters. Caught on `@furystack/entity-sync-client`, which needed a new `@furystack/core` workspace dep to access it.

### Resolved

- **`HttpUserContext.user` cache leaks across scopes** (2026-04) — replaced the private `user` field with `HttpUserContextImpl.userCache: WeakMap<request.headers, Promise<User>>`. Login no longer primes the cache; logout deletes the entry for its request. Ancestor-cached `HttpUserContext` instances are now safe to share across scopes, unblocking auth-jwt / entity-sync-service without the setup-scope dance.
- **Tier-2 eslint rule for removed API** (2026-04, rejected) — every removed entry point (`@Injectable`, `@Injected`, `getInstance`, `setExplicitInstance`, `createChild`, `addStore`, `StoreManager`) is already a TypeScript error on contact, so a duplicate eslint rule would not add signal. The obsolete `injectable-consistent-inject` rule was deleted alongside this decision.

## Tier-3 findings

- **`injector.cachedSingletons.has(X)` had no direct replacement in the new DI API.** Inputs that opted into `<Form>` integration relied on this probe. The fix was a dedicated optional token (`FormContextToken: Token<FormService | null, 'scoped'>`, default `null`) distinct from the impl interface. Pattern applies to every future "register me if a parent registered" surface. Adding a generic `injector.tryGet(token)` helper was considered and rejected — the explicit nullable token forces the consumer to think about "what does the absence of this service mean", whereas `tryGet` silently swallows it.
- **Declassing services that compose `EventHub` works, but the factory returns `Object.assign(hub, {...methods})`.** Matches tier-2 entity-sync-service's class-behind-token shape without needing a class. Trade-off: the returned object is a mutated `EventHub` instance, so consumers can't `assign` more properties onto it after the factory runs without widening the type. In-repo, no one does that. If future services need a cleaner surface, the right move is to declass `EventHub` itself (tracked in the "review classes" follow-up).
- **`Constructable` import has now been encountered in three places** (auth-jwt, entity-sync-client, shades). `Constructable` was moved from `@furystack/inject` to `@furystack/core` during the core migration. Any future package that touches `Constructable` needs `@furystack/core` as a dep and a matching `tsconfig.json` project reference.
- **Scoped tokens with throw-by-default factories fit "context services" precisely.** `LayoutService` used `'explicit'` lifetime (no-op at runtime, doc only) in the old API. The new pattern — scoped token with a factory that throws `LayoutServiceNotConfiguredError`, bound by the parent component via `scope.bind(Token, () => instance)` — captures the intent (`<Drawer>` inside `<PageLayout>` only) and fails loudly when the invariant breaks. Different from the `FormContextToken` optional pattern — pick based on whether "absent parent" is a valid state (`<Input>` outside `<Form>`) or a bug (`<Drawer>` outside `<PageLayout>`).
- **`createChild(...)` → `createScope(...)` is a pure rename.** Every tier-3 call site (micro-frontends, page-layout, form, theme showcase) migrated mechanically. Scope injectors satisfy `AsyncDisposable`, so they compose with `useDisposable` without wrappers.
- **`setExplicitInstance(instance, Token)` → `injector.bind(Token, () => instance)`.** Same semantics for explicit overrides; also works for test stubs. The old `.setExplicitInstance(new X(), X)` dance is strictly less expressive than `bind`+`invalidate`.
- **`new Injector()` fallback is still load-bearing for isolated-component tests.** Plan recommended throwing when `Shade.injector` can't find a parent injector; actual tests have renders like `const shade = (<div><Example /></div>).firstElementChild` where the `Example` component never mounts into an initialized shade root. Throwing broke ~1 canonical test in `component-factory.spec.tsx`. Kept the fallback and documented it; a hard throw is a separate follow-up.
