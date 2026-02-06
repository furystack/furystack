<!-- version-type: minor -->
# @furystack/shades-common-components

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

## 🗑️ Deprecated
<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

### Breadcrumb Component

Added a new `Breadcrumb` component for navigating hierarchical route structures with automatic active state detection.

**Features:**

- Dynamic route parameter support (e.g., `/users/:id`)
- Custom label rendering with `render` prop
- Configurable separators (string or JSX element)
- Active item detection based on current URL
- Optional home/root link
- Last item clickable/non-clickable configuration

**Basic Usage:**

```typescript
import { Breadcrumb } from '@furystack/shades-common-components'

<Breadcrumb
  homeItem={{ path: '/', label: 'Home' }}
  items={[
    { path: '/users', label: 'Users' },
    { path: '/users/:id', label: 'User Details', params: { id: '123' } },
  ]}
  separator=" › "
/>
```

**Type-Safe Usage:**

The `createBreadcrumb<TRoutes>()` helper provides compile-time route validation:

```typescript
import { createBreadcrumb } from '@furystack/shades-common-components'
import type { appRoutes } from './routes'

const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()

// ✅ Type-safe: only valid paths accepted
<AppBreadcrumb
  items={[{ path: '/buttons', label: 'Buttons' }]}
/>

// ❌ TypeScript error: invalid path
<AppBreadcrumb items={[{ path: '/nonexistent', label: 'Error' }]} />
```

**Route Parameters:**

Route parameters are automatically inferred from the path pattern:
- `path="/buttons"` — `params` is optional
- `path="/users/:id"` — `params: { id: string }` is required

### AppBarLink Enhancements

- Added `routingOptions` prop to `AppBarLink` for customizing route matching behavior using `path-to-regexp` options
- Added `createAppBarLink<TRoutes>()` helper for type-safe app bar links constrained to specific route trees

## 🐛 Bug Fixes
<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation
<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance
<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring
<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Added full test coverage for `Breadcrumb` component including runtime behavior tests and type safety validation

## 📦 Build
<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI
<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies
<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores
<!-- PLACEHOLDER: Describe other changes (chore:) -->
