<!-- version-type: minor -->

# @furystack/shades

## ✨ Features

### ScreenService Breakpoint Observables

Added reactive screen size breakpoint detection to `ScreenService` for building responsive UIs.

**New API:**

```typescript
const screenService = injector.getInstance(ScreenService)

// Check if screen is at least medium size
if (screenService.screenSize.atLeast.md.getValue()) {
  // Show desktop layout
}

// Subscribe to breakpoint changes for responsive behavior
screenService.screenSize.atLeast.md.subscribe((isAtLeastMd) => {
  if (isAtLeastMd) {
    console.log('Desktop or tablet view')
  } else {
    console.log('Mobile view')
  }
})
```

**Breakpoint Thresholds:**

- `xs`: 0px+ (all sizes)
- `sm`: 600px+ (small tablets and up)
- `md`: 960px+ (tablets and up)
- `lg`: 1280px+ (desktops and up)
- `xl`: 1920px+ (large desktops)

**New Exports:**

- `ScreenSize` type - A screen size breakpoint identifier (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`)
- `ScreenSizes` constant - Array of all breakpoint names in order

## 🧪 Tests

- Added integration tests for Shade resource management (`useObservable`, `useDisposable`)
