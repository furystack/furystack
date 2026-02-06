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

### New `NestedRouter` component

Added a `NestedRouter` component that supports hierarchical route definitions with parent/child relationships. Parent routes receive an `outlet` prop containing the rendered child route, enabling layout composition patterns (e.g. a shared layout wrapping page-specific content).

Routes are defined as a nested `Record` where keys are URL patterns (using `path-to-regexp`). The matching algorithm builds a chain from outermost to innermost route, then renders inside-out so each parent wraps its child.

**Usage:**

```typescript
import { NestedRouter, createComponent } from '@furystack/shades'

const routes = {
  '/': {
    component: ({ outlet }) => (
      <div>
        <nav>Shared Navigation</nav>
        {outlet}
      </div>
    ),
    children: {
      '/': { component: () => <div>Home</div> },
      '/about': { component: () => <div>About</div> },
    },
  },
}

<NestedRouter routes={routes} notFound={<div>404</div>} />
```

Key features:

- Hierarchical route matching with `buildMatchChain()` - matches from outermost to innermost route
- Lifecycle hooks (`onVisit`/`onLeave`) scoped per route level, only triggered for routes that actually change
- `findDivergenceIndex()` for efficient diffing - sibling navigation only triggers leave/visit for the changed subtree
- `notFound` fallback when no routes match

## 🐛 Bug Fixes

- Fixed `onLeave` lifecycle hooks not firing correctly when navigating between nested routes

## 🧪 Tests

- Added tests for `NestedRouter` covering route matching, nested layouts, lifecycle hooks, `notFound` fallback, and URL parameter extraction
- Refactored existing `Router`, `LazyLoad`, `LinkToRoute`, `RouteLink`, and integration tests to use `usingAsync` for proper `Injector` disposal
