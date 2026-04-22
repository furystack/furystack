<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

### Removed the legacy `Grid` component

The deprecated `Grid` component (and its `GridProps`, `HeaderCells`, `RowCells` helpers) has been removed. `DataGrid` is the supported replacement and has been the recommended API for some time.

**Impact:** Any module still importing `Grid` / `GridProps` / `HeaderCells` / `RowCells` from `@furystack/shades-common-components` will fail to resolve.

**Migration:** Switch to `DataGrid` + `CollectionService`. The showcase app's `DataGrid` page demonstrates the wiring with sorting, selection and pagination.

### Removed the legacy `Autocomplete` input

The deprecated `Autocomplete` input wrapper has been removed in favor of `Suggest`, which offers the same suggestion dropdown UX with both sync (`suggestions` prop) and async (`getEntries`/`getSuggestionEntry`) data sources and proper keyboard navigation.

**Impact:** Any module still importing `Autocomplete` from `@furystack/shades-common-components` will fail to resolve.

**Migration:** Replace `<Autocomplete suggestions={...} inputProps={...} />` with `<Suggest defaultPrefix={...} suggestions={...} onSelectSuggestion={...} />`. Labels and helper text previously configured through `inputProps` should be composed around the `Suggest` element using the existing `Input` / label components.

### Removed deprecated `onRowClick` / `onRowDoubleClick` options on `CollectionService`

The `CollectionServiceOptions.onRowClick` and `CollectionServiceOptions.onRowDoubleClick` constructor fields have been removed. These callbacks were replaced by the EventHub-based `subscribe('onRowClick', ...)` / `subscribe('onRowDoubleClick', ...)` (or `addListener`) API, which supports multiple subscribers and matches the rest of the observable primitives in the package.

**Impact:** `new CollectionService({ onRowClick, onRowDoubleClick })` no longer wires the callbacks; the options type no longer accepts them.

**Migration:** Subscribe after construction: `const service = new CollectionService(); service.addListener('onRowClick', handler);` (or `service.subscribe('onRowClick', handler)` for dispose-on-return semantics).

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
