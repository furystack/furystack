# Changelog

## [12.5.0] - 2026-03-06

### ✨ Features

- Added `LocationService.replace()` method for SPA redirects that replaces the current history entry instead of pushing a new one, preventing intermediate URLs from polluting the browser's back/forward stack

### 🐛 Bug Fixes

- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `LocationService` (`onLocationPathChanged`, `onLocationHashChanged`, `onLocationSearchChanged`) that could cause memory leaks when the service is disposed
- Fixed missing `[Symbol.dispose]()` calls for `ObservableValue` fields in `ScreenService` (`orientation` and `screenSize.atLeast` observables) that could cause memory leaks when the service is disposed

### 🧪 Tests

- Added `eslint-disable` comment in `vnode.integration.spec.tsx` for a test that intentionally uses `useState('isActive')` to verify re-render behavior

## [12.4.0] - 2026-03-05

### ✨ Features

### View Transition API support in NestedRouter

The `NestedRouter` component now integrates with the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) to animate route changes with browser-native transitions.

Enable globally at the router level with a single prop:

```tsx
<NestedRouter routes={appRoutes} viewTransition />
```

Or configure transition types for CSS targeting via `:active-view-transition-type()`:

```tsx
<NestedRouter routes={appRoutes} viewTransition={{ types: ['slide'] }} />
```

Individual routes can opt out or override the router-level config:

```tsx
'/about': {
  component: () => <AboutPage />,
  viewTransition: false, // disables transitions for this route
}
```

The feature is a progressive enhancement — non-supporting browsers fall back to instant page changes with zero additional code.

### View Transition API support in LazyLoad

The `LazyLoad` component now accepts a `viewTransition` prop to animate the swap from loader placeholder to loaded content:

```tsx
<LazyLoad viewTransition loader={<Skeleton />} component={async () => <MyPage />} />
```

### Shared `maybeViewTransition()` utility

Added and exported a `maybeViewTransition(config, update)` helper that wraps a synchronous DOM update in `document.startViewTransition()` when the API is available and `config` is truthy, falling back to a direct call otherwise. This utility is used internally by `NestedRouter` and `LazyLoad`, and is available for external consumers.

### 📚 Documentation

- Added JSDoc descriptions for `onVisit` and `onLeave` lifecycle hooks on `NestedRoute`, clarifying their timing relative to view transitions

### 🧪 Tests

- Added unit tests for `resolveViewTransition()` covering router-level defaults, per-route overrides, type merging, and opt-out behavior
- Added integration tests verifying `NestedRouter` calls `document.startViewTransition()` when enabled, passes transition types, respects per-route `viewTransition: false`, and falls back gracefully when the API is unavailable
- Added tests for `LazyLoad` verifying `startViewTransition` is called when `viewTransition` is enabled and skipped when not set

## [12.3.0] - 2026-03-04

### ✨ Features

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

### 🧪 Tests

- Added unit tests for `RouteMatchService` covering initialization, updates, subscriptions, and disposal
- Added unit tests for `resolveRouteTitle`, `resolveRouteTitles`, `buildDocumentTitle`, and `extractNavTree`
- Added integration tests verifying `NestedRouter` publishes the match chain to `RouteMatchService` on navigation
- Added tests verifying that `updateComponent()` and `updateComponentSync()` are no-ops after the element is removed from the DOM
- Added tests verifying that observable changes fired during disposal do not trigger additional renders

### 🐛 Bug Fixes

- Fixed ghost rendering race conditions where `updateComponent()` and `updateComponentSync()` could trigger re-renders on disconnected components. Added disconnected-state guards to both methods so that observable changes fired during disposal no longer cause stale render passes.

## [12.2.5] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling and ObservableValue `onError` support
- Updated `@furystack/rest` with improved error handling for malformed query parameters

## [12.2.4] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/jsdom` from ^27.0.0 to ^28.0.0
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [12.2.3] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [12.2.2] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [12.2.1] - 2026-02-22

### ⚡ Performance

### Synchronous child reconciliation

Child Shade component updates during parent-to-child reconciliation are now performed synchronously via a new `updateComponentSync()` method. This eliminates cascading microtask ticks when a parent re-render propagates props to child components, settling the entire component tree in a single call frame. A single `await flushUpdates()` is now sufficient to settle the full tree after a state change.

- Host props are now applied before patching children, allowing child components rendered synchronously to discover parent state (e.g. injector) via `getInjectorFromParent()` immediately

### 🧪 Tests

- Replaced `sleepAsync()` with `flushUpdates()` across all component tests for deterministic, timing-independent assertions

## [12.2.0] - 2026-02-22

### ✨ Features

### Dependency tracking for `useDisposable`

`useDisposable` now accepts an optional `deps` array parameter. When the serialized deps value changes between renders, the old resource is automatically disposed and a new one is created. This enables resources that depend on dynamic parameters (e.g., entity-sync subscriptions with changing query options) to be re-created without encoding all parameters into the cache key.

**Usage:**

```typescript
const liveEntity = useDisposable('entitySync:MyModel', () => syncService.subscribeEntity(MyModel, currentKey), [
  currentKey,
])
```

### 🧪 Tests

- Added tests for `useDisposable` dependency tracking in `ResourceManager`, covering re-creation on deps change and no-op when deps are unchanged

## [12.1.0] - 2026-02-19

### ✨ Features

- Added `navigate(path)` method to `LocationService` for programmatic SPA routing. It calls `history.pushState` and updates the internal routing state in a single step, replacing the need to call `history.pushState` and manually trigger state updates.

### ⬆️ Dependencies

- Updated `@furystack/inject` and `@furystack/utils`

## [12.0.1] - 2026-02-11

### 🐛 Bug Fixes

- Fixed `Router` and `NestedRouter` not abandoning stale navigations when routes change rapidly. Previously, a semaphore-based lock serialized navigations, allowing intermediate `onVisit`/`onLeave` callbacks to complete even after a newer navigation had been triggered. Now a version counter detects when a newer navigation has started and aborts the stale one, ensuring only the latest destination's lifecycle callbacks execute.
- Fixed `useState` setter throwing `ObservableAlreadyDisposedError` when called after component unmount (e.g. from async callbacks like image `onerror` or `fetch` responses that resolve after the component is removed from the DOM)

### 🧪 Tests

- Added tests for `Router` verifying that rapid navigation (e.g. clicking route B then immediately route C) skips intermediate route callbacks
- Added tests for `NestedRouter` verifying that rapid navigation abandons stale `onVisit` callbacks
- Added test verifying `useState` setter silently ignores calls after disposal

### ⬆️ Dependencies

- Bump `jsdom` from `^27.4.0` to `^28.0.0`
- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [12.0.0] - 2026-02-09

### 📝 Documentation

### ScreenService API Documentation

Improved JSDoc documentation for `ScreenService` with usage examples for responsive UI development.

**Documented APIs:**

- `screenSize.atLeast[size]` - Observable breakpoint detection
- `orientation` - Observable screen orientation tracking
- `breakpoints` - Breakpoint threshold definitions

**Breakpoint Thresholds:**

- `xs`: 0px+ (all sizes)
- `sm`: 600px+ (small tablets and up)
- `md`: 960px+ (tablets and up)
- `lg`: 1280px+ (desktops and up)
- `xl`: 1920px+ (large desktops)

### useObservable Documentation

Enhanced `useObservable` JSDoc with examples for the `onChange` callback option.

### 🧪 Tests

- Added integration tests for Shade resource management (`useObservable`, `useDisposable`)
- Added tests for `ScreenService` breakpoints, observables, and disposal
- Updated unit and integration tests to use `updateComponent()` instead of the removed `callConstructed()`
- Replaced `constructed` callback test with `useDisposable` cleanup test
- Updated integration tests to use `flushUpdates()` for asserting DOM state after microtask-based rendering
- Added test for batching multiple synchronous observable changes into a single render
- Added test for coalescing multiple `updateComponent()` calls into a single render pass
- Added tests for `NestedRouter` covering route matching, nested layouts, lifecycle hooks, `notFound` fallback, and URL parameter extraction
- Added tests for `NestedRouteLink` covering SPA navigation, parameterized route compilation, and `createNestedRouteLink` type constraints
- Refactored existing `Router`, `LazyLoad`, `LinkToRoute`, `RouteLink`, and integration tests to use `usingAsync` for proper `Injector` disposal
- Added `vnode.spec.ts` with unit tests for VNode creation, flattening, mounting, patching, prop diffing, and unmounting
- Added `vnode.integration.spec.tsx` with integration tests covering VNode reconciliation within Shade components
- Added `shade-host-props-ref.integration.spec.tsx` with tests for `useHostProps` and `useRef` behaviors
- Added tests for `ResourceManager.useObservable` observable switching behavior when a different observable reference is passed for the same key
- Updated existing integration tests to use `flushUpdates()` and the new API

### 💥 Breaking Changes

### Removed `constructed` callback from `Shade()`

The `constructed` option has been removed from the `Shade()` component definition. The `callConstructed()` method has also been removed from the `JSX.Element` interface. Any cleanup function returned by `constructed` is no longer supported.

**Migration:** Move initialization logic into `render` using `useDisposable()` for one-time setup that needs cleanup.

```typescript
// ❌ Before
const MyComponent = Shade({
  shadowDomName: 'my-component',
  constructed: ({ element }) => {
    const listener = () => { /* ... */ }
    window.addEventListener('click', listener)
    return () => window.removeEventListener('click', listener)
  },
  render: () => <div>Hello</div>,
})

// ✅ After
const MyComponent = Shade({
  shadowDomName: 'my-component',
  render: ({ element, useDisposable }) => {
    useDisposable('click-handler', () => {
      const listener = () => { /* ... */ }
      window.addEventListener('click', listener)
      return { [Symbol.dispose]: () => window.removeEventListener('click', listener) }
    })
    return <div>Hello</div>
  },
})
```

**Impact:** All components using the `constructed` callback must be updated.

### Rendering Engine Replaced with VNode-Based Reconciliation

The rendering engine has been replaced with a lightweight VNode-based reconciler. Instead of creating real DOM elements during each render and diffing them, the JSX factory now produces VNode descriptors during render mode. A reconciler diffs the previous VNode tree against the new one and applies surgical DOM updates using tracked element references.

**Impact:** All components using the `element` parameter from `RenderOptions` need to be updated. Components using `onAttach` or `onDetach` lifecycle hooks need to migrate to `useDisposable`.

### `element` Removed from `RenderOptions`

The `element` property (direct reference to the host custom element) has been removed from `RenderOptions`. Components should no longer imperatively mutate the host element.

**Migration:** Use the new `useHostProps` hook to declaratively set attributes and styles on the host element.

```typescript
// ❌ Before
render: ({ element, props }) => {
  element.setAttribute('data-variant', props.variant)
  element.style.setProperty('--color', colors.main)
  // ...
}

// ✅ After
render: ({ useHostProps, props }) => {
  useHostProps({
    'data-variant': props.variant,
    style: { '--color': colors.main },
  })
  // ...
}
```

### `onAttach` and `onDetach` Lifecycle Hooks Removed

The `onAttach` and `onDetach` component lifecycle hooks have been removed. Use `useDisposable` or `connectedCallback`/`disconnectedCallback` for setup and teardown logic.

```typescript
// ❌ Before
Shade({
  shadowDomName: 'my-component',
  onAttach: ({ element }) => {
    /* setup */
  },
  onDetach: ({ element }) => {
    /* cleanup */
  },
  render: ({ props }) => {
    /* ... */
  },
})

// ✅ After
Shade({
  shadowDomName: 'my-component',
  render: ({ props, useDisposable }) => {
    useDisposable('setup', () => {
      /* setup */
      return {
        [Symbol.dispose]: () => {
          /* cleanup */
        },
      }
    })
    // ...
  },
})
```

### 📚 Documentation

- Updated README to remove references to `constructed` and `initialState`, and to recommend `useDisposable` for one-time setup with cleanup
- Removed outdated note from README about DOM morphing behavior

### ⚠️ Changed

### Behavioral change: `updateComponent()` is now asynchronous

`updateComponent()` no longer renders synchronously. Any code that calls `updateComponent()` (or triggers it via observable changes) and immediately inspects the DOM will now see stale state. Use `await flushUpdates()` to wait for pending renders to complete before reading the DOM.

### ⚡ Performance

### Microtask-based batched component updates

`updateComponent()` now schedules renders via `queueMicrotask()` instead of executing them synchronously. Multiple calls to `updateComponent()` within the same synchronous block (e.g. several observable changes) are coalesced into a single render pass, reducing unnecessary DOM updates.

- Component updates are batched via `queueMicrotask`, coalescing multiple `updateComponent()` calls into a single render pass
- VNode props are shallow-compared to skip unnecessary DOM updates
- Style diffing patches only changed properties instead of replacing the entire style

### ✨ Features

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

### New `NestedRouteLink` and `createNestedRouteLink` components

Added `NestedRouteLink` for SPA navigation with type-safe parameterized routes. It intercepts clicks to use `history.pushState` and compiles URL parameters (e.g. `/users/:id`) automatically.

`createNestedRouteLink()` creates a narrowed version of `NestedRouteLink` constrained to a specific route tree, so TypeScript only accepts valid paths and requires `params` when the route has parameters.

**Usage:**

```typescript
import { NestedRouteLink, createNestedRouteLink } from '@furystack/shades'

// Basic usage — params are inferred from the href pattern
<NestedRouteLink href="/users/:id" params={{ id: '123' }}>User</NestedRouteLink>

// Type-safe usage — constrained to a route tree
const AppLink = createNestedRouteLink<typeof appRoutes>()
<AppLink href="/buttons">Buttons</AppLink>
```

### Route type utilities

Added type-level utilities for working with nested route trees:

- `ExtractRoutePaths<T>` - recursively extracts all valid full URL paths from a nested route tree
- `ExtractRouteParams<T>` - extracts parameter names from a URL pattern into a typed record
- `ConcatPaths<Parent, Child>` - concatenates parent and child paths handling the `/` root
- `UrlTree<TPaths>` - validates URL constant objects against a set of valid paths

### VNode-Based Reconciliation Engine

Introduced a new `vnode.ts` module that implements a VNode-based virtual DOM reconciler. The JSX factory produces lightweight VNode descriptors during component renders, which are then diffed against the previous tree to apply minimal DOM updates. This eliminates the overhead of creating and diffing real DOM elements on every render cycle.

### `useHostProps` Hook

Added `useHostProps` to `RenderOptions`, enabling components to declaratively set attributes, data attributes, ARIA attributes, event handlers, and styles (including CSS custom properties) on the host custom element. It can be called multiple times per render; calls are merged and diffed against the previous render.

### `useRef` Hook

Added `useRef` to `RenderOptions`, allowing components to create mutable ref objects that capture references to child DOM elements. Refs are cached by key and persist across renders. The ref's `current` property is set to the DOM element after mount and `null` on unmount.

```typescript
const inputRef = useRef<HTMLInputElement>('input')
// In JSX:
<input ref={inputRef} />
// Later:
inputRef.current?.focus()
```

### `ref` Prop Support on Intrinsic Elements

Added a `ref` property to `PartialElement<T>`, enabling `ref` objects to be passed to any intrinsic JSX element (e.g., `<div ref={myRef} />`). The VNode reconciler handles mounting and unmounting refs automatically.

### Native SVG Element Support

Added first-class SVG support with proper namespace handling. SVG elements are now created with `createElementNS` using the correct SVG namespace, and attributes are applied via `setAttribute` instead of property assignment. This includes:

- A new `svg.ts` module with SVG tag detection and namespace constants
- A new `svg-types.ts` module with typed SVG attribute interfaces for all standard SVG elements (shapes, gradients, filters, animations, etc.)
- Updated `IntrinsicElements` with proper typed SVG element definitions

### `flushUpdates` Utility

Added `flushUpdates()` — a test utility that returns a promise resolving after the current microtask queue has been processed, enabling tests to await batched component updates before asserting DOM state.

- Exported `flushUpdates()` utility that returns a promise resolving after the current microtask queue is processed, allowing tests to reliably wait for batched renders to complete
- Extended `attachDataAttributes` to forward `aria-*` attributes from component props to the DOM element, enabling accessible components built with Shades

### 🗑️ Deprecated

- Deprecated `Router`, `Route`, `RouterProps`, and `RouterState` in favor of `NestedRouter` and its types
- Deprecated `RouteLink` and `RouteLinkProps` in favor of `NestedRouteLink`
- Deprecated `LinkToRoute` and `LinkToRouteProps` in favor of `NestedRouteLink`

### 🐛 Bug Fixes

- Fixed `onLeave` lifecycle hooks not firing correctly when navigating between nested routes

### ♻️ Refactoring

- `appendChild` in `shade-component.ts` now accepts `Element | DocumentFragment` instead of `HTMLElement | DocumentFragment` for broader compatibility
- `createComponent` now acts as a render-mode switch: when in render mode it produces VNode descriptors, otherwise it creates real DOM elements as before

### ⬆️ Dependencies

- Peer dependency on `@furystack/shades` updated to the new major version for downstream packages

## [11.1.0] - 2026-02-01

### ✨ Features

### CSS Property for Component-Level Styling

Added a new `css` property to `Shade()` components that enables defining component-level styles with support for pseudo-selectors and nested selectors. This provides a cleaner alternative to using `useState` for hover/focus states.

**Key benefits:**

- Define `:hover`, `:active`, `:focus`, and `:disabled` states declaratively
- Support for nested selectors (e.g., `& .className`, `& > div`)
- Styles are injected as a shared stylesheet, reducing DOM overhead
- Type-safe with the new `CSSObject` type

**Usage:**

```typescript
const Button = Shade({
  shadowDomName: 'my-button',
  css: {
    padding: '12px 24px',
    backgroundColor: 'blue',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'darkblue' },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
    '& .icon': { marginRight: '8px' }
  },
  render: ({ children }) => <button>{children}</button>
})
```

- Added `CSSObject` type - type definition for CSS styles with nested selector support
- Added `StyleManager` - singleton that manages CSS injection and deduplication for components
- Added `generateCSS()` - utility function to convert `CSSObject` to CSS strings
- Extended support for customized built-in elements (e.g., `a[is="my-link"]` selectors)

### 📚 Documentation

- Updated README with documentation for the new `css` property and styling patterns

### 🧪 Tests

- Added tests for `generateCSS()` covering camelCase conversion, pseudo-selectors, and nested selectors
- Added tests for `StyleManager` covering component registration, deduplication, and customized built-in elements

## [11.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [11.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [11.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
