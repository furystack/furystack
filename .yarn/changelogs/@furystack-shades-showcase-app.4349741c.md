<!-- version-type: patch -->

# @furystack/shades-showcase-app

## ✨ Features

### Route-level hash / query demo on the Tabs page

The `/navigation/tabs` route now declares a readonly tuple of allowed hash literals (`'ctrl-1' | 'ctrl-2' | 'ctrl-3'`) and a query validator that parses an optional `highlight` parameter. A new "Route-level hash & query (type-safe)" section on the Tabs page demonstrates `createNestedRouteLink`, `createNestedNavigate` and `createNestedHooks` against those declarations, including a live readout of the current typed hash and query.

## ♻️ Refactoring

- Migrated the route tree declaration in `routes.tsx` from a `satisfies Record<string, NestedRoute<any>>` assertion to the new `defineNestedRoutes` helper so per-route `query` / `hash` generics are preserved for downstream extractors.
- Renamed `href` → `path` on every `NestedRouteLink`, `AppBarLink`, and `CustomNestedRouteLink` call site (sidebar navigation, home page, layout-tests index, view-transitions demo, app-bar links) to match the new `@furystack/shades` / `@furystack/shades-common-components` API.

### Routes are now the single source of truth for navigation

Deleted the hand-maintained `src/navigation.ts` config (categories, pages, icons, `findNavItemByPath`) — nothing imported it anymore. Sidebar, AppBar and breadcrumbs already consume `extractNavTree(appRoutes['/'].children)`, so the route tree declared in `routes.tsx` is the sole description of the showcase navigation.

### Centralised typed routing helpers in `app-routing.tsx`

Introduced `src/app-routing.tsx` as the canonical home for showcase route typing. Exposes:

- `AppRoutePath` — `ExtractRoutePaths<typeof appRoutes>`.
- `ShowcaseNestedRouteLink` — `createNestedRouteLink<typeof appRoutes>()`.
- `showcaseNavigate` — `createNestedNavigate<typeof appRoutes>()`.
- `showcaseReplace` — `createNestedReplace<typeof appRoutes>()`.
- `ShowcaseReplaceRoute` — a typed redirect component whose props mirror the args of `createNestedReplace`; replaces the untyped `<Navigate to="...">` helper used by parent routes to forward to a default child. `path`, `params`, `query` and `hash` are narrowed against the route tree at the call site.

All showcase components now route through these helpers instead of reaching for `LocationService` directly, so adding or renaming a route updates the compile-time surface of every navigation call-site automatically.

### Removed remaining untyped navigation call-sites

- Sidebar page links render `ShowcaseNestedRouteLink` instead of a raw `<a>` + `locationService.navigate(href)` pair; category headers for leaf categories call `showcaseNavigate` for the typed pathway.
- `routes.tsx` parent-route fallbacks switched from `<Navigate to="/inputs-and-forms/buttons" />` (string prop) to `<ShowcaseReplaceRoute path="/inputs-and-forms/buttons" />` (typed against `appRoutes`) at all 8 redirect sites.
- `ShowcaseAppBar` drops the `as AppRoutePath` cast on `node.fullPath` thanks to the newly-typed `extractNavTree` output.
- `getCategoryNodes()` now returns `NavTreeNode<typeof appRoutes['/']['children']>` (exported as `AppNavTreeNode` from `src/nav-tree.ts`), so sidebar node props carry typed `pattern` / `fullPath` down to every consumer.
