<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

### `AppBarLink` now uses `path` instead of `href`

`AppBarLink` re-exports the `NestedRouteLinkProps` shape from `@furystack/shades`, which was renamed from `href` to `path` to align with the rest of the routing APIs.

**Before:**

```tsx
<AppBarLink href="/dashboard">Dashboard</AppBarLink>
<AppBarLink href="/users/:id" params={{ id: '1' }}>User</AppBarLink>
```

**After:**

```tsx
<AppBarLink path="/dashboard">Dashboard</AppBarLink>
<AppBarLink path="/users/:id" params={{ id: '1' }}>User</AppBarLink>
```

**Impact:** All call sites of `AppBarLink` and `createAppBarLink` must be updated. `props.href` reads inside downstream wrappers are no longer valid.

**Migration:** Rename every `<AppBarLink href="..." />` occurrence to `<AppBarLink path="..." />`, including `routingOptions`-augmented usages.

## ♻️ Refactoring

- `Breadcrumb` now forwards the compiled path to the underlying `NestedRouteLink` as `path` rather than `href`.
- Type bounds on `createAppBarLink` / `createBreadcrumb` / `TypedBreadcrumbProps` were widened from `NestedRoute<unknown>` to `NestedRoute<any, any, any>` so routes declaring the new `query` / `hash` schemas satisfy them.
