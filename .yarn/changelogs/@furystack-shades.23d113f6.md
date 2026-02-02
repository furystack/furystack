<!-- version-type: patch -->

# @furystack/shades

## 📝 Documentation

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

## 🧪 Tests

- Added integration tests for Shade resource management (`useObservable`, `useDisposable`)
- Added tests for `ScreenService` breakpoints, observables, and disposal
