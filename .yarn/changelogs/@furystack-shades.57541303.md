<!-- version-type: minor -->

# @furystack/shades

## ✨ Features

### Spatial Navigation Service

Added `SpatialNavigationService` for D-pad / arrow-key spatial navigation across interactive elements. The service intercepts arrow key events and moves focus spatially based on element geometry, supporting section boundaries via `data-nav-section` attributes and optional cross-section navigation.

**Key capabilities:**

- Arrow key focus movement based on Euclidean distance between element centers
- Section-scoped navigation with `data-nav-section` DOM attributes
- Cross-section navigation with focus memory (restores last-focused element per section)
- Input passthrough — arrow keys work normally inside text inputs, textareas, selects, and contenteditable elements
- Configurable `Backspace` → `history.back()` and `Escape` → parent section behaviors
- Runtime enable/disable via `enabled` observable
- `configureSpatialNavigation()` helper to set options before the singleton is first resolved

**Usage:**

```typescript
import { SpatialNavigationService, configureSpatialNavigation } from '@furystack/shades'

// Configure before first use
configureSpatialNavigation(injector, {
  initiallyEnabled: true,
  crossSectionNavigation: true,
})

// Or resolve directly with defaults
const spatialNav = injector.getInstance(SpatialNavigationService)

// Toggle at runtime
spatialNav.enabled.setValue(false)
```

### `useDisposable` deps parameter

Added optional `deps` parameter to `useDisposable` — when provided, the resource is re-created (and the old one disposed) whenever the serialized deps value changes.

```typescript
useDisposable('my-resource', () => createResource(value), [value])
```

## 🧪 Tests

- Added tests for `SpatialNavigationService` covering directional movement, section boundaries, cross-section navigation, input passthrough, focus memory, and disposal
