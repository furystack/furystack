<!-- version-type: major -->

# @furystack/rest-service

## 💥 Breaking Changes

Server managers are gone — every subsystem is now a DI token. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the `ServerManager`, `ApiManager`, `StaticServerManager`, and `ProxyManager` classes. They are replaced by:
  - `HttpServerPoolToken` — shared HTTP server pool (singleton).
  - `ServerTelemetryToken` — event hub for `onApiRequestError`, `onProxyFailed`, `onWebSocketActionFailed`, `onWebSocketProxyFailed`. Subscribe via `injector.get(ServerTelemetryToken).subscribe(...)`.
  - `HttpAuthenticationSettings` interface + token.
  - `HttpUserContext` interface + token.
- `useRestService` / `useHttpAuthentication` / `useStaticFiles` / `useProxy` keep their public shapes; internals are fully token-based.
- Endpoint generators (`createGetCollectionEndpoint`, `createGetEntityEndpoint`, `createPostEndpoint`, `createPatchEndpoint`, `createDeleteEndpoint`) now take a `DataSetToken` from `@furystack/repository` instead of `{ model, primaryKey }`.
- `UserStore` and `SessionStore` are throw-by-default. Apps must bind concrete persistent stores at bootstrap.
- `HttpUserContext.user` is no longer a shared field. Per-request identity is stored in a `WeakMap<request.headers, Promise<User>>` so ancestor-cached instances don't leak identity across scopes.
- `useHttpAuthentication` takes a `userDataSet: DataSetToken` — the old `getUserDataSet(injector)` / `getSessionDataSet(injector)` callbacks are gone.
