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

- `render:(options: RenderOptions)=>JSX.Element` – A required method that will be executed on each render.
- `initialState` – A default state that can be updated during the component lifecycle.
- `tagName` – Can be specified as the custom element's name in the DOM.
- `constructed: (options: RenderOptions)=>void` – Optional callback executed after component construction. It can return a cleanup method (e.g., free up resources, dispose value observers, etc.).
- `onAttach: (options: RenderOptions)=>void` – Executed when the component is attached to the DOM.
- `onDetach: (options: RenderOptions)=>void` – Executed when the component is detached from the DOM.
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
  tagName: 'my-component',
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
  tagName: 'my-button',
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

The lifecycle methods receive the following options as a parameter:

- `props` – The current readonly props object for the element. As props are passed from the parent, it is read-only.
- `getState()` – Returns the current state. The state object is also read-only and immutable and can be updated only with a corresponding method.
- `updateState(newState: TState, skipRender?: boolean)` – Updates (patches) the component state. An optional flag can indicate that this state change shouldn't trigger a re-render (e.g., form input fields change, etc.).
- `injector` – An injector instance. It can be retrieved from the closest parent or specified on the state or props.
- `children` – The children element(s) of the component.
- `element` – A reference to the current component's custom element (root).
- `logger` – A specified logger instance with a pre-defined scope.

### Bundled Goodies

The **@furystack/shades** package contains a router component, a router-link component, a location service, and a lazy-load component.

## Core Concepts

- Shade is close to the DOM and the natives. You are encouraged to use native browser methods when possible.
- You can use small independent services for state tracking with the injector.
- You can use resources (value observers) that will be disposed automatically when your component is removed from the DOM.
- Re-rendering can be skipped on state update. For example, why re-render a whole form if only one field has changed?
- Nothing is true, everything is permitted. 🗡️
