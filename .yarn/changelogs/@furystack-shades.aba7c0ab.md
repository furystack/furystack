<!-- version-type: minor -->

# @furystack/shades

## ✨ Features

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

## 📚 Documentation

- Added JSDoc descriptions for `onVisit` and `onLeave` lifecycle hooks on `NestedRoute`, clarifying their timing relative to view transitions

## 🧪 Tests

- Added unit tests for `resolveViewTransition()` covering router-level defaults, per-route overrides, type merging, and opt-out behavior
- Added integration tests verifying `NestedRouter` calls `document.startViewTransition()` when enabled, passes transition types, respects per-route `viewTransition: false`, and falls back gracefully when the API is unavailable
- Added tests for `LazyLoad` verifying `startViewTransition` is called when `viewTransition` is enabled and skipped when not set
