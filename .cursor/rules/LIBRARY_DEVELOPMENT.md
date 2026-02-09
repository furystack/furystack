# Library Development Guidelines

## Package Structure

### Monorepo Organization

FuryStack is organized as a monorepo with individual packages:

```
packages/
├── core/                  # Core DI and utilities
├── inject/                # Dependency injection
├── shades/                # UI framework
├── rest-service/          # REST API framework
├── logging/               # Logging utilities
├── cache/                 # Caching utilities
├── utils/                 # General utilities
└── [other-packages]/
```

### Package Configuration

Each package should have:

```json
{
  "name": "@furystack/package-name",
  "version": "1.0.0",
  "type": "module",
  "main": "./esm/index.js",
  "types": "./types/index.d.ts",
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "types": "./types/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "test": "vitest"
  }
}
```

## Dependency Injection Patterns

### Injectable Classes

Use `@Injectable` decorator for classes that should be managed by DI:

```typescript
// ✅ Good - injectable service
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class LoggerService {
  private logs: string[] = []

  public log(message: string): void {
    this.logs.push(message)
  }

  public getLogs(): readonly string[] {
    return this.logs
  }
}
```

### Lifetime Management

Choose appropriate lifetime:

- **singleton**: One instance per injector (default for services)
- **transient**: New instance every time (for disposable objects)
- **scoped**: One instance per scope (for request-scoped data)

```typescript
// ✅ Good - appropriate lifetimes
@Injectable({ lifetime: 'singleton' })
export class ConfigService {
  // Shared config across app
}

@Injectable({ lifetime: 'transient' })
export class RequestContext {
  // New instance per request
}
```

### Dependency Injection

Use `@Injected` to inject dependencies:

```typescript
// ✅ Good - injected dependencies
import { Injectable, Injected } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class UserService {
  @Injected(LoggerService)
  declare private logger: LoggerService

  @Injected(ApiClient)
  declare private apiClient: ApiClient

  public async getUser(id: string): Promise<User> {
    this.logger.log(`Getting user: ${id}`)
    return await this.apiClient.fetchUser(id)
  }
}
```

## Observable Patterns

### ObservableValue

Create reactive values with `ObservableValue`:

```typescript
// ✅ Good - observable value
import { ObservableValue } from '@furystack/utils'

export class DataStore {
  public data = new ObservableValue<Data | null>(null)

  public updateData(newData: Data): void {
    this.data.setValue(newData)
  }

  public subscribe(callback: (data: Data | null) => void): { dispose: () => void } {
    return this.data.subscribe(callback)
  }
}
```

### Observable as Public API

Expose observables in public APIs:

```typescript
// ✅ Good - observable in public API
@Injectable({ lifetime: 'singleton' })
export class SessionService {
  /**
   * Observable of the current user
   */
  public currentUser = new ObservableValue<User | null>(null)

  /**
   * Subscribe to user changes
   * @param callback - Callback function
   * @returns Disposable subscription
   */
  public onUserChange(callback: (user: User | null) => void): { dispose: () => void } {
    return this.currentUser.subscribe(callback)
  }
}
```

## Disposable Resources

### Implement Symbol.dispose

All classes that hold resources should implement disposal:

```typescript
// ✅ Good - proper disposal
export class WebSocketConnection {
  private socket: WebSocket
  private subscriptions = new Set<() => void>()

  constructor(url: string) {
    this.socket = new WebSocket(url)
  }

  public subscribe(callback: (data: unknown) => void): { dispose: () => void } {
    const handler = (event: MessageEvent) => callback(event.data)
    this.socket.addEventListener('message', handler)

    const dispose = () => {
      this.socket.removeEventListener('message', handler)
      this.subscriptions.delete(dispose)
    }

    this.subscriptions.add(dispose)
    return { dispose }
  }

  public [Symbol.dispose](): void {
    this.subscriptions.forEach((dispose) => dispose())
    this.subscriptions.clear()
    this.socket.close()
  }
}
```

### Using Disposables

Document disposal patterns for library users:

````typescript
// ✅ Good - disposal documentation
/**
 * Creates a scoped resource that will be automatically disposed
 * @example
 * ```typescript
 * using resource = createResource();
 * resource.use(); // Resource automatically disposed at end of scope
 * ```
 */
export function createResource(): Disposable {
  return {
    use: () => console.log('Using resource'),
    [Symbol.dispose]: () => console.log('Disposing resource'),
  }
}
````

## Cache Implementation

### Cache Class

Implement cache with proper generics:

```typescript
// ✅ Good - cache implementation
export class Cache<TArgs extends unknown[], TResult> {
  private cache = new Map<string, CachedValue<TResult>>()

  constructor(private options: CacheOptions<TArgs, TResult>) {}

  /**
   * Get value from cache or load it
   * @param args - Arguments for the load function
   * @returns Cached or loaded value
   */
  public async get(...args: TArgs): Promise<TResult> {
    const key = this.getCacheKey(args)
    const cached = this.cache.get(key)

    if (cached && !this.isExpired(cached)) {
      return cached.value
    }

    const value = await this.options.load(...args)
    this.cache.set(key, { value, updatedAt: new Date() })
    return value
  }

  /**
   * Get observable for cache value
   * @param args - Arguments for the load function
   * @returns Observable of cache state
   */
  public getObservable(...args: TArgs): ObservableValue<CacheState<TResult>> {
    // Implementation
  }

  private getCacheKey(args: TArgs): string {
    return JSON.stringify(args)
  }

  private isExpired(cached: CachedValue<TResult>): boolean {
    return Date.now() - cached.updatedAt.getTime() > this.options.maxAge
  }
}
```

## Request/Response Patterns

### RequestAction Type

Define request actions with proper typing:

```typescript
// ✅ Good - typed request action
import type { RequestAction } from '@furystack/rest-service'

export type GetUserAction = RequestAction<{
  method: 'GET'
  url: { id: string }
  result: User
}>

export const getUserAction: GetUserAction = async ({ getUrlParams }) => {
  const { id } = await getUrlParams()
  const user = await fetchUser(id)
  return JsonResult(user)
}
```

### RequestError

Provide proper error types:

```typescript
// ✅ Good - RequestError implementation
export class RequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

// Usage in actions
export const createUserAction: RequestAction<CreateUserType> = async ({ getBody }) => {
  const body = await getBody()

  if (!body.email) {
    throw new RequestError('Email is required', 400)
  }

  // Action logic
}
```

## Breaking Changes

### Semantic Versioning

Follow semantic versioning strictly:

- **Major** (x.0.0): Breaking changes to public API
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

```typescript
// ❌ Breaking change - remove or rename exported API
// Old:
export function oldFunction() {}

// New:
// export function oldFunction() {} // Removed - MAJOR version bump

// ✅ Non-breaking change - add new API
// Old:
export function existingFunction() {}

// New:
export function existingFunction() {}
export function newFunction() {} // Added - MINOR version bump
```

### Deprecation Pattern

Deprecate before removing:

```typescript
// ✅ Good - deprecation warning
/**
 * @deprecated Use `newFunction` instead. Will be removed in v8.0.0
 */
export function oldFunction(): void {
  console.warn('oldFunction is deprecated. Use newFunction instead.')
  return newFunction()
}

export function newFunction(): void {
  // New implementation
}
```

## Documentation

### JSDoc for Public APIs

All public APIs must have comprehensive JSDoc:

````typescript
/**
 * Creates a new Injector for dependency injection
 *
 * @param options - Configuration options
 * @param options.parent - Parent injector for hierarchical DI
 * @param options.level - Depth level in injector hierarchy
 * @returns New Injector instance
 *
 * @example
 * ```typescript
 * const injector = new Injector({ parent: parentInjector });
 * const service = injector.getInstance(MyService);
 * ```
 */
export class Injector {
  constructor(options?: InjectorOptions) {
    // Implementation
  }

  /**
   * Gets an instance of the specified class
   * @typeParam T - The type of instance to retrieve
   * @param constructor - The class constructor
   * @returns Instance of the class
   * @throws {Error} If the class is not injectable
   */
  public getInstance<T>(constructor: Constructor<T>): T {
    // Implementation
  }
}
````

## Shades Rendering Patterns

### Removed APIs

The following APIs have been removed. **Do not generate code using them:**

- **`element`** is no longer available in `RenderOptions`. Use `useHostProps` for host element attributes/styles and `useRef` for child DOM access.
- **`onAttach` / `onDetach`** lifecycle hooks are removed from `ShadeOptions`. Use `useDisposable` to manage resources that need cleanup on unmount.

```typescript
// ❌ REMOVED - element in render options
render: ({ element }) => {
  element.setAttribute('data-active', 'true') // No longer works
}

// ✅ Use useHostProps instead
render: ({ useHostProps }) => {
  useHostProps({ 'data-active': 'true' })
}

// ❌ REMOVED - onAttach / onDetach
Shade({
  onAttach: ({ element }) => {
    /* ... */
  },
  onDetach: ({ element }) => {
    /* ... */
  },
})

// ✅ Use useDisposable instead
render: ({ useDisposable }) => {
  useDisposable('myResource', () => {
    // Setup code runs once
    return {
      [Symbol.dispose]: () => {
        /* Cleanup on unmount */
      },
    }
  })
}
```

### `useHostProps` -- Declarative Host Element Attributes

`useHostProps` declaratively sets attributes and styles on the host custom element. Can be called multiple times per render; each call merges into the previous values.

```typescript
render: ({ props, useHostProps }) => {
  useHostProps({
    'data-variant': props.variant,
    role: 'progressbar',
    'aria-valuenow': String(props.value),
    style: {
      '--btn-color-main': props.color,
      display: 'flex',
      gap: '8px',
    },
  })

  return <div>{props.children}</div>
}
```

**Key behaviors:**

- String/boolean/null values are set as HTML attributes via `setAttribute`
- Object and function values are assigned as properties on the host element (not attributes)
- Event handlers can be set: `useHostProps({ onclick: handleClick })`
- CSS custom properties (e.g. `--my-color`) are applied via `setProperty`
- Class properties like `injector` can be set to propagate scoped injectors to child components

### `useRef` -- DOM Element Access

`useRef` creates a mutable ref object that captures a child DOM element. Refs are cached by key and stable across renders.

```typescript
render: ({ useRef }) => {
  const inputRef = useRef<HTMLInputElement>('input')

  // Refs are null during the first synchronous render pass.
  // Use queueMicrotask for deferred access after mount.
  queueMicrotask(() => {
    inputRef.current?.focus()
  })

  return <input ref={inputRef} type="text" />
}
```

The `ref` prop is available on all intrinsic JSX elements (`div`, `input`, `span`, SVG elements, etc.).

**Only create refs when you need direct DOM access** (focus, scroll, measurements, animations, form registration, third-party library integration). Do not create refs that are only assigned to elements but never read from -- this is dead code. For imperative DOM mutations like `classList.add` or `style.display` toggling, prefer `useState` with declarative JSX instead.

```typescript
// ❌ Bad - ref used only for classList manipulation
const backdropRef = useRef<HTMLDivElement>('backdrop')
requestAnimationFrame(() => backdropRef.current?.classList.add('visible'))
return <div ref={backdropRef} className="backdrop">...</div>

// ✅ Good - declarative state controls the class
const [isVisible, setIsVisible] = useState('isVisible', false)
requestAnimationFrame(() => setIsVisible(true))
return <div className={`backdrop${isVisible ? ' visible' : ''}`}>...</div>
```

### Anti-pattern: `useDisposable` + `ObservableValue` for Local State

When you need local component state that triggers re-renders, use `useState` directly. Do not manually create an `ObservableValue` with `useDisposable` and subscribe with `useObservable` -- this is exactly what `useState` does internally.

```typescript
// ❌ Bad - manual ObservableValue + useObservable for local state
const obs = useDisposable('count', () => new ObservableValue(0))
const [count] = useObservable('count', obs)

// ✅ Good - useState handles this internally
const [count, setCount] = useState('count', 0)
```

Reserve `useDisposable` + `ObservableValue` for cases where the observable must be passed to a service or shared across component boundaries (not just parent-to-child). For parent-to-child state, prefer plain props.

### VNode Reconciliation

Shades uses a VNode-based reconciler with **positional (index-based) child matching**. There is no key-based reconciliation. When list items reorder, all children from the reorder point onward are patched or replaced.

```typescript
// ❌ Risky - reordering raw intrinsic elements in a dynamic list
// causes unnecessary DOM churn and potential state loss
render: ({ props }) => {
  return <ul>{props.items.map(item => <li>{item.name}</li>)}</ul>
}

// ✅ Better - wrap each item in a Shade component
// The component boundary prevents inner-DOM churn on reorder
render: ({ props }) => {
  return <ul>{props.items.map(item => <ListItem item={item} />)}</ul>
}
```

### Microtask Batching

Multiple state changes within the same synchronous execution are coalesced into a single render pass via `queueMicrotask`. This means DOM updates are not synchronous after calling `setState` or `observable.setValue()`.

In tests, use `await flushUpdates()` to wait for batched renders to complete before asserting DOM state.

### Component Styling

#### Use `css` Property for Component Styles

When creating Shades components, prefer the `css` property over `style` for component-level styling:

```typescript
// ✅ Good - use css for component defaults and pseudo-selectors
const Button = Shade({
  shadowDomName: 'my-button',
  css: {
    padding: '12px 24px',
    backgroundColor: 'blue',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'darkblue' },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
  },
  render: ({ props }) => <button>{props.children}</button>,
})

// ❌ Avoid - using useState for hover/active states
const Button = Shade({
  shadowDomName: 'my-button',
  render: ({ useState }) => {
    const [isHovered, setIsHovered] = useState('hover', false)
    return (
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ backgroundColor: isHovered ? 'darkblue' : 'blue' }}
      >
        Click me
      </button>
    )
  },
})
```

#### When to Use `style` vs `css`

| Use Case                  | `style` | `css` |
| ------------------------- | ------- | ----- |
| Hover/focus/active states | ❌      | ✅    |
| Per-instance overrides    | ✅      | ❌    |
| Nested element styling    | ❌      | ✅    |
| Dynamic values from props | ✅      | ❌    |
| Component defaults        | ⚠️      | ✅    |

#### Anti-pattern: useState for CSS States

**Do not** use `useState` to track CSS states like hover, focus, or active. Use `css` pseudo-selectors instead:

```typescript
// ❌ Bad - unnecessary state for CSS-representable behavior
const [isHovered, setIsHovered] = useState('hover', false)
const [isFocused, setIsFocused] = useState('focus', false)

// ✅ Good - CSS handles these states natively
css: {
  '&:hover': { /* hover styles */ },
  '&:focus': { /* focus styles */ },
  '&:active': { /* active styles */ },
}
```

#### Anti-pattern: `useHostProps({ style })` for Static or Attribute-Driven Styles

If a style is static (same every render) or varies based on a data attribute that is already set, define it in the `css` block instead of using `useHostProps({ style })`.

```typescript
// ❌ Bad - static style in useHostProps
useHostProps({ style: { display: 'contents' } })

// ✅ Good - in css block
css: { display: 'contents' }

// ❌ Bad - style toggled by an attribute the component already sets
useHostProps({
  'data-opened': isOpen ? '' : undefined,
  style: { width: isOpen ? '100%' : '0%' },
})

// ✅ Good - CSS rule on the data attribute
css: {
  width: '0%',
  '&[data-opened]': { width: '100%' },
}
// render:
useHostProps({ ...(isOpen ? { 'data-opened': '' } : {}) })
```

Use `useHostProps({ style })` only for truly dynamic values (CSS custom properties from themes/props, consumer-provided style overrides).

#### Type-Safe Theme Variables with `cssVariableTheme`

When using theme values in the `css` property, **always import and use `cssVariableTheme`** instead of raw CSS variable strings. This provides type safety and autocomplete:

```typescript
// ✅ Good - type-safe theme access
import { cssVariableTheme } from '@furystack/shades-common-components'

const MyComponent = Shade({
  shadowDomName: 'my-component',
  css: {
    color: cssVariableTheme.text.primary, // Type-checked!
    backgroundColor: cssVariableTheme.background.paper,
    borderColor: cssVariableTheme.palette.primary.main,
    // For template literals when combining with other values:
    boxShadow: `0 0 0 2px ${cssVariableTheme.palette.primary.main} inset`,
  },
  render: () => {
    /* ... */
  },
})

// ❌ Avoid - raw strings with no type safety
const BadComponent = Shade({
  shadowDomName: 'bad-component',
  css: {
    color: 'var(--shades-theme-text-primary)', // No autocomplete, typos not caught
    backgroundColor: 'var(--shades-theme-background-paper)',
  },
  render: () => {
    /* ... */
  },
})
```

**Available theme properties:**

| Path                                    | Description           |
| --------------------------------------- | --------------------- |
| `cssVariableTheme.text.primary`         | Primary text color    |
| `cssVariableTheme.text.secondary`       | Secondary text color  |
| `cssVariableTheme.text.disabled`        | Disabled text color   |
| `cssVariableTheme.background.default`   | Default background    |
| `cssVariableTheme.background.paper`     | Paper/card background |
| `cssVariableTheme.palette.primary.main` | Primary accent color  |
| `cssVariableTheme.palette.error.main`   | Error color           |
| `cssVariableTheme.divider`              | Divider color         |

The `cssVariableTheme` object is typed as `Theme` and contains all CSS variable strings, enabling full IDE autocomplete and compile-time type checking.

## Export Patterns

### Index Exports

Organize exports clearly:

```typescript
// ✅ Good - packages/core/src/index.ts
// Main exports
export { Injectable, Injected } from './decorators.js'
export { Injector } from './injector.js'

// Type exports
export type { InjectorOptions, InjectableOptions } from './types.js'
export type { Constructor, Disposable } from './common-types.js'

// Re-exports from other packages (if needed)
export { ObservableValue } from '@furystack/utils'
```

### Avoid Side Effects

Package imports should not cause side effects:

```typescript
// ✅ Good - no side effects on import
export class Logger {
  constructor() {
    // Initialization only when instantiated
  }
}

// ❌ Avoid - side effects on import
console.log('Logger module loaded') // Side effect!
export class Logger {}
```

## Summary

**Key Principles:**

1. **Public API first** - Design for library users
2. **Dependency injection** - Use @Injectable and @Injected
3. **Observable patterns** - Expose ObservableValue for reactive state
4. **Disposable resources** - Implement Symbol.dispose
5. **Type safety** - No `any`, explicit types for public APIs
6. **Semantic versioning** - Follow strictly for all changes
7. **Deprecation** - Deprecate before removing
8. **Documentation** - JSDoc on all public APIs
9. **No side effects** - Package imports should be safe
10. **Test coverage** - 100% for public APIs

**Library Development Checklist:**

- [ ] @Injectable on all services
- [ ] @Injected for dependencies
- [ ] Symbol.dispose for resources
- [ ] ObservableValue for reactive state
- [ ] Explicit types on all exports
- [ ] JSDoc on public APIs
- [ ] Tests for all exports
- [ ] Semantic versioning followed
- [ ] No breaking changes without deprecation
- [ ] No side effects on import

**Tools:**

- DI: `@furystack/inject`
- Observable: `@furystack/utils`
- Build: `yarn build` (tsc -b packages)
- Test: `yarn test`
- Version: `yarn bumpVersions`
