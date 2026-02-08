# Changelog

## [12.0.0] - 2026-02-08

### 🚨 Breaking Changes

#### `tagName` renamed to `tagName`

The `tagName` property in `Shade()` has been renamed to `tagName` to accurately reflect its purpose -- it defines the Custom Element tag name, not Shadow DOM.

```typescript
// ❌ Before
const MyComponent = Shade({
  tagName: 'my-component',
  render: () => <div>Hello</div>,
})

// ✅ After
const MyComponent = Shade({
  tagName: 'my-component',
  render: () => <div>Hello</div>,
})
```

**Impact:** All `Shade()` calls across your codebase need updating.

**Migration:** Search and replace `tagName:` with `tagName:` in all `.ts` and `.tsx` files.

#### Rendering is now asynchronous (microtask-batched)

State changes from `useState`, `useObservable`, `useSearchState`, and `useStoredState` are now batched via `queueMicrotask()`. Multiple synchronous state changes produce a single re-render instead of one per change.

```typescript
// ❌ Before (v11): each setter triggers an immediate re-render
const [count, setCount] = useState('count', 0)
const [name, setName] = useState('name', '')
setCount(1) // re-render #1
setName('John') // re-render #2

// ✅ After (v12): synchronous changes are coalesced
setCount(1) // schedules update
setName('John') // coalesced into same microtask
// → single re-render after microtask flush
```

**Impact:** Code that reads the DOM immediately after a state setter and expects synchronous updates will need adjustment.

**Migration:** If you depend on synchronous DOM updates after a state change, await a microtask:

```typescript
setValue(42)
await new Promise((resolve) => queueMicrotask(resolve))
// DOM is now updated
```

`updateComponent()` remains available for synchronous imperative updates when needed.

#### DOM reconciliation replaces full replacement

Components now use DOM reconciliation instead of `replaceChildren()`. Existing DOM nodes are patched in place rather than destroyed and recreated. This preserves focus, scroll positions, CSS animations, and child component state.

```typescript
// ❌ Before (v11): full subtree replacement on every render
// - Child elements are destroyed and recreated
// - Focus is lost
// - Scroll positions reset
// - CSS transitions restart

// ✅ After (v12): in-place patching
// - Same DOM nodes are reused when possible
// - Focus, scroll, and animations are preserved
// - Child Shade components are NOT remounted on parent re-render
```

**Impact:** If you relied on child DOM nodes being fresh instances on every render, this is a behavioral change. Custom Element children are now preserved across parent re-renders -- their `disconnectedCallback` is no longer called unless actually removed from the tree.

**Migration:** Use `key` attributes to force element replacement when you need fresh instances:

```tsx
<div key={uniqueId}>This element will be replaced when key changes</div>
```

### ✨ Features

#### Fine-Grained Reactive Bindings

`ObservableValue` instances can now be used directly in JSX for zero-re-render updates. When the observable changes, only the bound text node or attribute updates -- the component's render function is NOT re-executed.

```tsx
const Counter = Shade({
  tagName: 'my-counter',
  render: ({ useDisposable }) => {
    const count = useDisposable('count', () => new ObservableValue(0))
    return (
      <div>
        <span>Count: {count}</span>
        <button onclick={() => count.setValue(count.getValue() + 1)}>+</button>
      </div>
    )
  },
})
```

This coexists with `useState` and `useObservable` -- use whichever pattern suits the use case. Reactive bindings are ideal for frequently updating values (counters, timers, live data) where avoiding full re-renders improves performance.

**Supported binding locations:**

- **Text content:** Pass an `ObservableValue` as a JSX child to create a reactive text node
- **Attributes:** Pass an `ObservableValue` as a prop value for reactive attribute binding
- **Style properties:** Pass an `ObservableValue` for individual style property binding

Subscriptions are automatically cleaned up when the component unmounts.

#### Microtask Batching with `scheduleUpdate()`

A new `scheduleUpdate()` method is available on Shade component instances. It coalesces multiple update requests into a single re-render via `queueMicrotask()`. All built-in hooks (`useState`, `useObservable`, etc.) now use this by default.

### 🔧 Changed

- `useObservable` default `onChange` callback now calls `scheduleUpdate()` instead of `updateComponent()`
- `useState` callback now calls `scheduleUpdate()` instead of `updateComponent()`
- `useSearchState` and `useStoredState` callbacks similarly updated
- `updateComponent()` remains public for direct imperative use and initial render

## Migration Guide

### Prerequisites

- Update `@furystack/shades` to v12.0.0
- Update all sibling packages (`@furystack/shades-common-components`, etc.) to their corresponding major versions

### Step 1: Rename `tagName` to `tagName`

Search and replace across your codebase:

```bash
# Find all occurrences
grep -r "tagName" --include="*.ts" --include="*.tsx" src/

# Replace (using sed or your editor's find-and-replace)
# tagName: → tagName:
```

### Step 2: Audit Synchronous DOM Reads After State Changes

If you have code that sets state and immediately reads the DOM, insert a microtask await:

```typescript
// Before
setCount(newValue)
const el = document.querySelector('.counter')
console.log(el?.textContent) // might still show old value in v12

// After
setCount(newValue)
await new Promise((resolve) => queueMicrotask(resolve))
const el = document.querySelector('.counter')
console.log(el?.textContent) // now reflects the update
```

### Step 3: Review Custom `onChange` Handlers

If you passed custom `onChange` callbacks to `useObservable` that call `updateComponent()` directly, consider switching to `scheduleUpdate()` for batching benefits. Direct `updateComponent()` calls still work but bypass batching.

### Step 4: Test

```bash
yarn build
yarn test
```

### Common Issues

**Issue:** Test expects synchronous DOM update after `useState` setter

**Solution:** Add a microtask flush after the state change:

```typescript
setValue(42)
await new Promise((r) => queueMicrotask(r))
// Now assert on the DOM
```

**Issue:** TypeScript error `Property 'tagName' does not exist`

**Solution:** Rename `tagName` to `tagName` in the `Shade()` call.

**Issue:** Child component re-initializes unexpectedly

**Solution:** The reconciler preserves Custom Element children by default. If you need a fresh instance, add a `key` attribute that changes when you want replacement.

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
  tagName: 'my-button',
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
