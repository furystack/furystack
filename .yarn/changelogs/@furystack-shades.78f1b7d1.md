<!-- version-type: major -->

# @furystack/shades

## 💥 Breaking Changes

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

## ✨ Features

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

## ⚡ Performance

- Component updates are batched via `queueMicrotask`, coalescing multiple `updateComponent()` calls into a single render pass
- VNode props are shallow-compared to skip unnecessary DOM updates
- Style diffing patches only changed properties instead of replacing the entire style

## ♻️ Refactoring

- `appendChild` in `shade-component.ts` now accepts `Element | DocumentFragment` instead of `HTMLElement | DocumentFragment` for broader compatibility
- `createComponent` now acts as a render-mode switch: when in render mode it produces VNode descriptors, otherwise it creates real DOM elements as before

## 🧪 Tests

- Added `vnode.spec.ts` with unit tests for VNode creation, flattening, mounting, patching, prop diffing, and unmounting
- Added `vnode.integration.spec.tsx` with integration tests covering VNode reconciliation within Shade components
- Added `shade-host-props-ref.integration.spec.tsx` with tests for `useHostProps` and `useRef` behaviors
- Added tests for `ResourceManager.useObservable` observable switching behavior when a different observable reference is passed for the same key
- Updated existing integration tests to use `flushUpdates()` and the new API

## 📚 Documentation

- Removed outdated note from README about DOM morphing behavior

## ⬆️ Dependencies

- Peer dependency on `@furystack/shades` updated to the new major version for downstream packages
