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
- `shadowDomName` – Can be specified as the custom element's name in the DOM.
- `constructed: (options: RenderOptions)=>void` – Optional callback executed after component construction. It can return a cleanup method (e.g., free up resources, dispose value observers, etc.).
- `onAttach: (options: RenderOptions)=>void` – Executed when the component is attached to the DOM.
- `onDetach: (options: RenderOptions)=>void` – Executed when the component is detached from the DOM.

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
