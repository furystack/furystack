# @furystack/shades

Shades is a UI library for FuryStack that uses type-safe JSX components, unidirectional data binding, and the same DI/IoC, logging, and utility libraries as FuryStack backend services.

## Installation

```bash
npm install @furystack/shades
# or
yarn add @furystack/shades
```

## Usage

You can check the [@furystack/boilerplate](https://github.com/furystack/boilerplate) repository for a working example.

### A Shade (Component)

A shade (component) can be constructed from the following properties:

- `render:(options: RenderOptions)=>JSX.Element` – A required method that will be executed on each render. Use `useDisposable` within render for one-time setup that needs cleanup.
- `shadowDomName` – The custom element tag name. Must follow Custom Elements naming convention (lowercase, must contain a hyphen).
- `style` – Optional inline styles applied to each component instance. Use for per-instance overrides.
- `css` – Optional CSS styles injected as a stylesheet during component registration. Supports pseudo-selectors and nested selectors.

### Styling

Shades provides two complementary approaches to styling components:

#### `style` Property (Inline Styles)

The `style` property applies inline styles to each component instance. Use this for:

- Per-instance style overrides
- Dynamic styles that change based on props/state
- Quick prototyping

```typescript
const MyComponent = Shade({
  shadowDomName: 'my-component',
  style: {
    display: 'flex',
    padding: '16px',
  },
  render: () => <div>Content</div>,
})

// Override styles on specific instances
<MyComponent style={{ marginTop: '20px' }} />
```

#### `css` Property (Stylesheet Injection)

The `css` property injects CSS rules into a stylesheet once per component type. Use this for:

- Component-level default styles
- Pseudo-selectors (`:hover`, `:active`, `:focus`, `:disabled`, etc.)
- Nested selectors (child elements, class names)
- Better performance (styles injected once, not per-instance)

```typescript
const Button = Shade({
  shadowDomName: 'my-button',
  css: {
    padding: '12px 24px',
    backgroundColor: 'blue',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'darkblue',
    },

    '&:active': {
      transform: 'scale(0.98)',
    },

    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },

    '& .icon': {
      marginRight: '8px',
    },
  },
  render: ({ props }) => (
    <button disabled={props.disabled}>
      {props.icon && <span className="icon">{props.icon}</span>}
      {props.children}
    </button>
  ),
})
```

#### When to Use Which

| Use Case                  | `style` | `css` |
| ------------------------- | ------- | ----- |
| Hover/focus/active states | ❌      | ✅    |
| Per-instance overrides    | ✅      | ❌    |
| Nested element styling    | ❌      | ✅    |
| Dynamic values from props | ✅      | ❌    |
| Component defaults        | ⚠️      | ✅    |

Both properties can be used together. Inline `style` will override `css` due to CSS specificity rules.

### Render Options

The `render` function receives a `RenderOptions` object with these hooks:

- `props` – The current readonly props object. Passed from the parent, treat as immutable.
- `injector` – The injector instance, inherited from the closest parent or set explicitly.
- `children` – The children element(s) of the component.
- `renderCount` – How many times this component has rendered.
- `useState(key, initialValue)` – Local state that triggers re-renders on change.
- `useObservable(key, observable, options?)` – Subscribes to an `ObservableValue`; re-renders on change by default. Provide a custom `onChange` to skip re-renders.
- `useSearchState(key, initialValue)` – State synced with URL search parameters.
- `useStoredState(key, initialValue, storageArea?)` – State persisted to `localStorage` or `sessionStorage`.
- `useDisposable(key, factory)` – Creates a resource that is automatically disposed when the component unmounts.
- `useHostProps(hostProps)` – Declaratively sets attributes, styles, and CSS variables on the host element. Prefer this over direct DOM manipulation.
- `useRef(key)` – Creates a ref object for imperative access to child DOM elements.

### Bundled Goodies

The **@furystack/shades** package contains a router component, a router-link component, a location service, and a lazy-load component.

## Core Concepts

- Shade is close to the DOM and the natives. You are encouraged to use native browser methods when possible.
- You can use small independent services for state tracking with the injector.
- You can use resources (value observers) that will be disposed automatically when your component is removed from the DOM.
- Re-rendering can be skipped on state update. For example, why re-render a whole form if only one field has changed?
- Nothing is true, everything is permitted. 🗡️
