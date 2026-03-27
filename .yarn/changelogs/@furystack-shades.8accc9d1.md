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

### Type-safe programmatic navigation for NestedRouter

Added `nestedNavigate()` and `createNestedNavigate()` for programmatic SPA navigation within the nested router system.

- `nestedNavigate(injector, path, params?)` navigates to a route path using `LocationService`, with optional route parameter compilation (e.g. `/users/:id`)
- `createNestedNavigate<typeof routes>()` returns a type-safe wrapper that restricts `path` to valid route paths and requires `params` when the route is parameterized

**Usage:**

```typescript
const appNavigate = createNestedNavigate<typeof appRoutes>()

appNavigate(injector, '/buttons')
appNavigate(injector, '/users/:id', { id: '123' })
```

## 🐛 Bug Fixes

- Fixed `ExtractRoutePaths` and `createNestedRouteLink` generic constraints from `NestedRoute<unknown>` to `NestedRoute<any>`, resolving type inference failures when routes use concrete component prop types

## 🧪 Tests

- Added tests for `nestedNavigate()` and `createNestedNavigate()`
- Added tests for `NestedRouteLink` and `createNestedRouteLink` with parameterized routes
