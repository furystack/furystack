# @furystack/shades

Shades is a UI Library for FuryStack with that uses type-safe JSX component, unidirectional data binding and the same DI/IOC, logging and utility libraries as the FuryStack Backend Services.

## Usage

You can check the [@furystack/boilerplate](https://github.com/furystack/boilerplate) repository for a working example.

### A Shade (component)

A shade (component) can be constructed from the following properties:

- `ts render:(options: RenderOptions)=>JSX.Element` - A required method that will be executed on each and every render.
- `initialState` - A default state that can be updated during the component lifecycle
- `shadowDomName` can be specified - that will be the custom element's name in the DOM
- `ts constructed: (options: RenderOptions)=>void` is an optional callback that will be executed after component construction. It can return a cleanup method (e.g. free up resources, dispose value observers, etc...)
- `ts onAttach: (options: RenderOptions)=>void` is executed when the component is attached to the DOM
- `ts onDetach: (options: RenderOptions)=>void` is executed when the component is detached from the DOM

### Render options

The lifecycle methods will get the following options from a parameter:

- props - The current readonly **props** object for the element. As props are passed from the parent, it is read only
- getState() - method that will return the current state. State object is also read only and immutable and can be updated with a corresponding method only.
- updateState(newState: TState, skipRender?: boolean) - Updates (patches) the component state. An optional flag can indicate that this state change shouldn't trigger a re-render (e.g. form input fields change, etc...)
- injector - An injector instance. It can be retrieved from the closest parent or can be specified on the _state_ or _props_
- children - The children element(s) of the component
- element - A reference to the current component's custom element (root)
- logger - A specified _logger_ instance with a pre-defined _scope_

### Bundled goodies

The **@furystack/shades** package contains a router component, a router-link component, a location-service and a lazy-load component.

## Core concepts

- Shade is close to the DOM and the natives. You are encouraged to use native browser methods while you can
- You can use small independent services for state tracking with the _injector_
- ~~Use observable values. Subscribe in the `constructed()` method and dispose them on the callback that it returns.~~
- You can use resources (valueobservers) that will be disposed automatically when your component will be removed from DOM.
- Re-render **can** be skipped on state update. E.g. Why should you break a whole form with a re-render? Why should you update a complete _grid_ if only on item's one field has been changed?
- Nothing is true, everything is permitted 🗡
