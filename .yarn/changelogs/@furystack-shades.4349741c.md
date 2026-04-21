<!-- version-type: major -->

# @furystack/shades

## 💥 Breaking Changes

### `NestedRouteLink` and `nestedNavigate` now accept a `path` prop / object argument

`NestedRouteLink` now uses `path` instead of `href`, matching the route-definition vocabulary used by `Breadcrumb` and the new navigation helpers. `nestedNavigate` / `createNestedNavigate` switched from positional arguments to an options object so that the new `query` and `hash` fields can be passed alongside `path` / `params` without a growing parameter list.

**Before:**

```typescript
<NestedRouteLink href="/users/:id" params={{ id: '1' }}>User</NestedRouteLink>

nestedNavigate(injector, '/users/:id', { id: '1' })
```

**After:**

```typescript
<NestedRouteLink path="/users/:id" params={{ id: '1' }}>User</NestedRouteLink>

nestedNavigate(injector, { path: '/users/:id', params: { id: '1' } })
```

**Impact:** Every call site of `NestedRouteLink`, `nestedNavigate`, `createNestedRouteLink` and `createNestedNavigate` must be updated. Wrappers that forward `NestedRouteLinkProps` (for example `AppBarLink` in `@furystack/shades-common-components`) also switched to `path`.

**Migration:** Rename `href` → `path` on every `NestedRouteLink` call site, and rewrite `nestedNavigate(injector, path, params?)` as `nestedNavigate(injector, { path, params })`.

### `NestedRoute` gained two optional generic parameters

`NestedRoute<TMatchResult>` is now `NestedRoute<TMatchResult, TQuery, THash>`. Existing single-generic usages keep working through the defaults, but the `component` opts are now always called with `query` and `hash` fields (populated with `null` / `undefined` when the route declares no schema). `MatchChainEntry` likewise carries `query: unknown` and `hash: string | undefined` fields.

**Impact:** Test fixtures that construct `MatchChainEntry` literals by hand must supply `query` and `hash`. Components that destructure `component` opts by name are unaffected.

**Migration:** Add `query: null, hash: undefined` to any hand-rolled `MatchChainEntry` literal (typically in tests).

## ✨ Features

### Route-level `hash` and `query` schemas

`NestedRoute` can now declare a readonly tuple of allowed hash literals and a query-string validator. Both flow through the new `createNestedRouteLink` / `createNestedNavigate` / `createNestedHooks` helpers to constrain call sites at compile time and surface typed values to the route's `component` opts at render time.

**Usage:**

```typescript
const routes = defineNestedRoutes({
  '/users/:id': {
    hash: ['profile', 'settings'] as const,
    query: (raw): { page: number } | null =>
      typeof raw.page === 'number' ? { page: raw.page } : null,
    component: ({ match, query, hash }) => <UserPage match={match} query={query} hash={hash} />,
  },
})

const AppLink = createNestedRouteLink<typeof routes>()
const appNavigate = createNestedNavigate<typeof routes>()

<AppLink path="/users/:id" params={{ id: '1' }} query={{ page: 2 }} hash="profile">User</AppLink>
appNavigate(injector, { path: '/users/:id', params: { id: '1' }, hash: 'settings' })
```

- The router matches on path only — an invalid query / hash never prevents navigation. Components receive `query: null` or `hash: undefined` when the URL does not satisfy the declared schema.
- Query serialization uses the existing `@furystack/rest` encoder, so any JSON-serializable shape round-trips without a schema library dependency.

### `defineNestedRoutes` helper

`defineNestedRoutes(...)` is an identity helper that preserves the exact inferred literal type of a route tree while still applying a structural `Record<string, NestedRoute<...>>` constraint. Using a plain `satisfies` assertion with the historical bound `NestedRoute<any>` collapsed per-route generics to their defaults, which defeated the downstream extractors used by `createNestedRouteLink` / `createNestedNavigate` / `createNestedHooks`. Declaring route trees through `defineNestedRoutes` keeps the literal shape intact so each route's declared query validator return type and hash literal tuple remain recoverable.

```typescript
export const appRoutes = defineNestedRoutes({
  '/tabs': { hash: ['a', 'b'] as const, component: () => <div /> },
})
```

### `createNestedHooks` factory

`createNestedHooks<typeof routes>()` returns `{ getTypedQuery, getTypedHash }`, synchronous read helpers that look up the route declared at a given path and narrow the current URL's query / hash against its schema. Intended for non-component consumers (services, side effects) that need a typed snapshot without subscribing through the router.

```typescript
const { getTypedQuery, getTypedHash } = createNestedHooks<typeof routes>()
const query = getTypedQuery(injector, '/users/:id', routes) // typed | null
const hash = getTypedHash(injector, '/users/:id', routes) // typed | undefined
```

### `buildNestedNavigateUrl` utility

Exposed the URL-composition helper used internally by `nestedNavigate` and `NestedRouteLink` so callers can produce a compiled URL (path + query + hash) without triggering navigation.

### `nestedReplace` / `createNestedReplace`

Symmetric counterparts to `nestedNavigate` / `createNestedNavigate` that call `history.replaceState` (via `LocationService.replace`) instead of `pushState`. Use this for SPA redirects — auth guards, canonicalization — where the intermediate URL should not be recoverable with the browser's Back button. Accepts the exact same object-argument shape and inherits the full type-safe narrowing of `path` / `params` / `query` / `hash` against the route tree.

```typescript
const appReplace = createNestedReplace<typeof appRoutes>()

// Unauthenticated visitor → send to /login without polluting history
appReplace(injector, { path: '/login' })
```

## ♻️ Refactoring

- The nested router now subscribes to query-string and hash changes in addition to path changes, re-rendering the matched chain without firing `onLeave` / `onVisit` lifecycle hooks when only the URL's search or hash segment changes.
- `findDivergenceIndex` keeps its path-only semantics; a separate `hasQueryOrHashChanged` helper drives re-render decisions when the matched chain stays stable but its query / hash differ.

## 🧪 Tests

- Added type-level and runtime coverage for the new `query` / `hash` paths on `createNestedNavigate`, `createNestedRouteLink`, and the router's match-chain enrichment.
- Added a `buildNestedNavigateUrl` suite covering params, query and hash composition.
