<!-- version-type: minor -->

# @furystack/shades

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

### Route Metadata on `NestedRoute`

Routes can now carry a `meta` object with a `title` field (static string or async resolver function). The `NestedRouteMeta` interface supports declaration merging so applications can extend it with custom fields (e.g. `icon`, `hidden`).

**Usage:**

```typescript
import type { NestedRoute } from '@furystack/shades'

const routes = {
  '/users/:id': {
    meta: {
      title: ({ match }) => `User ${match.params.id}`,
    },
    component: ({ match }) => <div>User {match.params.id}</div>,
  },
}
```

### `RouteMatchService` — Observable match chain

New singleton service that exposes the current `NestedRouter` match chain as an `ObservableValue`. Consumers like breadcrumbs, document title updaters, and navigation trees can subscribe to `currentMatchChain` instead of re-running route matching themselves.

### Route metadata utility functions

- `resolveRouteTitle(entry, injector)` — resolves the title for a single match chain entry, supporting static strings, sync functions, and async functions
- `resolveRouteTitles(chain, injector)` — resolves all titles from a match chain in parallel
- `buildDocumentTitle(titles, options?)` — composes resolved titles into a single document title string with configurable separator and prefix
- `extractNavTree(routes, parentPath?)` — extracts a `NavTreeNode[]` tree from route definitions for rendering sidebar navigation or sitemaps

## 🧪 Tests

- Added unit tests for `RouteMatchService` covering initialization, updates, subscriptions, and disposal
- Added unit tests for `resolveRouteTitle`, `resolveRouteTitles`, `buildDocumentTitle`, and `extractNavTree`
- Added integration tests verifying `NestedRouter` publishes the match chain to `RouteMatchService` on navigation
