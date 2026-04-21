<!-- version-type: patch -->

# @furystack/shades-showcase-app

## ✨ Features

### Route-level hash / query demo on the Tabs page

The `/navigation/tabs` route now declares a readonly tuple of allowed hash literals (`'ctrl-1' | 'ctrl-2' | 'ctrl-3'`) and a query validator that parses an optional `highlight` parameter. A new "Route-level hash & query (type-safe)" section on the Tabs page demonstrates `createNestedRouteLink`, `createNestedNavigate` and `createNestedHooks` against those declarations, including a live readout of the current typed hash and query.

## ♻️ Refactoring

- Migrated the route tree declaration in `routes.tsx` from a `satisfies Record<string, NestedRoute<any>>` assertion to the new `defineNestedRoutes` helper so per-route `query` / `hash` generics are preserved for downstream extractors.
- Renamed `href` → `path` on every `NestedRouteLink`, `AppBarLink`, and `CustomNestedRouteLink` call site (sidebar navigation, home page, layout-tests index, view-transitions demo, app-bar links) to match the new `@furystack/shades` / `@furystack/shades-common-components` API.
