# Library Development Guidelines

## Package Structure

### Monorepo Organization

FuryStack is organized as a monorepo with individual packages:

```
packages/
├── core/                  # Physical stores, identity context, DI helpers
├── inject/                # Functional DI (defineService, Injector)
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

## Linting Rules (`@furystack/eslint-plugin`)

The `@furystack/eslint-plugin` enforces many FuryStack-specific patterns automatically. Key rule categories:

- **Observable disposal** -- classes owning `ObservableValue` or `Cache` must implement `[Symbol.dispose]()` and dispose every field (`require-disposable-for-observable-owner`, `require-observable-disposal`)
- **Disposable safety** -- prefer `using()` / `usingAsync()` over manual create-then-dispose (`prefer-using-wrapper`)
- **Shades rendering** -- no module-level JSX, no removed APIs, no manual `.subscribe()` in render, no `.getValue()` without `useObservable`, prefer `useState` over manual `ObservableValue`, no `useState` for CSS-representable states, valid `customElementName`, prefer `LocationService` and `NestedRouteLink` for navigation
- **REST actions** -- throw `RequestError` (not `Error`), wrap endpoints with `Validate()`
- **Data access** -- prefer `getDataSetFor(injector, dataSetToken)` over direct `injector.get(StoreToken)` in application code (`no-direct-store-token`)

Generate code that satisfies these rules from the start. Verify with `yarn lint`.

## Dependency Injection Patterns

FuryStack uses **functional DI**: services are declared with `defineService` / `defineServiceAsync`, which return opaque **tokens**. There are **no decorators** (`@Injectable` / `@Injected` do not exist). An `Injector` resolves tokens, caches instances per their lifetime, and disposes them when it is disposed.

### Defining a Service

```typescript
import { defineService } from '@furystack/inject'

export const Counter = defineService({
  name: 'my-app/Counter',
  lifetime: 'singleton',
  factory: () => {
    let value = 0
    return {
      increment: () => ++value,
      getValue: () => value,
    }
  },
})
```

- `name` is debug/readability only — token identity is the returned object reference.
- `lifetime` is required (`singleton` / `scoped` / `transient`). There is no default.
- `factory` receives a `ServiceContext` and must return the service instance.

### Resolving Dependencies

Inside a factory, pull dependencies via the `ctx.inject` / `ctx.injectAsync` helpers. Outside a factory, resolve from an `Injector` via `get` / `getAsync`.

```typescript
import { defineService } from '@furystack/inject'

const Logger = defineService({
  name: 'my-app/Logger',
  lifetime: 'singleton',
  factory: () => ({ log: (msg: string) => console.log(msg) }),
})

export const UserService = defineService({
  name: 'my-app/UserService',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const logger = inject(Logger)
    return {
      getUser: async (id: string) => {
        logger.log(`Getting user: ${id}`)
        // ...
      },
    }
  },
})
```

A singleton factory can only depend on other singletons — the type of `inject` is refined per-lifetime at compile time so a mis-scoped dependency is a type error, not a runtime surprise.

### Lifetime Management

- **singleton** — one instance per injector tree, cached at the root. For shared, stateless-ish services (loggers, config, factories).
- **scoped** — one instance per scope (`injector.createScope(...)`). For per-request / per-connection state (`HttpUserContext`, per-message DI context).
- **transient** — a new instance every resolution, not cached. Rarely what you want.

**Rules of thumb:**

| Case                                               | Lifetime                     |
| -------------------------------------------------- | ---------------------------- |
| Config singletons (settings tokens, policies)      | `singleton`                  |
| Shared stateful managers that must be disposable   | `singleton` with `onDispose` |
| Per-request / per-connection / per-test-case state | `scoped`                     |
| One-off factory outputs, short-lived handles       | `transient`                  |

### The Injector

```typescript
import { createInjector, usingAsync } from '@furystack/inject'

const injector = createInjector()
const counter = injector.get(Counter)
counter.increment()

// Test / request patterns
await usingAsync(createInjector(), async (i) => {
  const service = i.get(UserService)
  // ...
})
```

Key methods on `Injector`:

- `get(token)` — synchronous resolution (rejects async tokens at compile time).
- `getAsync(token)` — resolves sync or async tokens; returns `Promise<T>`.
- `bind(token, factory)` — install an override on the injector that would own the cached instance. Drops any cached instance. Use in app bootstrap (to wire a real store behind a throw-by-default token) and in tests (to stub dependencies).
- `invalidate(token)` — drop the cached instance so the next `get` re-runs the factory. Useful after rebinding sub-dependencies.
- `createScope({ owner })` — create a child injector whose lifetime is independent. Scoped tokens are cached on the first injector that resolves them, so scoping matters.
- `withScope(parent, async (scope) => ...)` — convenience wrapper that creates a scope, runs the body, and disposes the scope in `finally`.
- `injector[Symbol.asyncDispose]()` — disposes the injector and every `onDispose` callback registered by its factories (LIFO).

### Scope Caching Gotcha

`findCached` walks the scope parent chain. If a setup step resolves a scoped token on an ancestor (commonly on the root), every descendant scope returns that same cached instance — any state held on the instance is effectively shared. Either:

1. Do setup inside a short-lived scope so the cache lives on that scope:

   ```typescript
   await usingAsync(injector.createScope({ owner: 'setup' }), async (setup) => {
     setup.get(HttpUserContext).cookieLogin(...)
   })
   ```

2. Store per-scope state in a `WeakMap` keyed by a per-scope identity (e.g. the request's `headers`) instead of on the instance itself. This is what `HttpUserContext` does for its `userCache`.

### Overrides: `bind` + `invalidate`

`bind(Token, factory)` replaces the factory on the owning injector and drops any cached instance. Use it wherever the old decorator-era code would have called `setExplicitInstance`.

```typescript
// Configure a throw-by-default persistent store with a concrete backend
injector.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))

// Rebinding a setting after the service has been created? Invalidate the dependent:
injector.bind(LocationServiceSettings, () => ({ ...custom }))
injector.invalidate(LocationService)
```

### Lifecycle and Disposal

Factories register teardown via `ctx.onDispose`:

```typescript
export const ClientPool = defineService({
  name: 'my-app/ClientPool',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const clients = new Map<string, Client>()
    onDispose(async () => {
      await Promise.all([...clients.values()].map((c) => c.close()))
      clients.clear()
    })
    return {
      getFor: (url: string) => clients.get(url) ?? /* ... */,
    }
  },
})
```

Callbacks run in LIFO order on `injector[Symbol.asyncDispose]()` so cleanup composes correctly when services depend on each other. Always prefer `onDispose` inside a factory over storing cleanup state outside of it.

Helpers like `useRestService`, `useHttpAuthentication`, `useWebSocketApi`, `useJwtAuthentication` do not run inside a factory context. When they need to register disposal (e.g. close a pooled HTTP server), they push callbacks onto a scoped `CleanupRegistry` service — see `packages/websocket-api/src/use-websocket-api.ts` for the pattern.

### System Identity Context

Server-internal operations (password hashing, token refresh, background jobs) need an elevated identity scope. `useSystemIdentityContext` returns a disposable child injector with a fabricated identity that bypasses authorization checks:

```typescript
import { useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'

const systemInjector = useSystemIdentityContext({ injector, username: 'MyService' })
// either dispose manually via onDispose, or wrap in usingAsync(...)
```

When used inside a service factory, register disposal:

```typescript
factory: ({ injector, onDispose }) => {
  const systemInjector = useSystemIdentityContext({ injector, username: 'MyService' })
  onDispose(() => systemInjector[Symbol.asyncDispose]())
  // ...
}
```

**Warning:** `useSystemIdentityContext` bypasses all authorization. Never pass the returned injector to a user-facing request handler.

### Disposable Linting Rule

The `furystack/prefer-using-wrapper` rule flags manual `instance[Symbol.dispose]()` calls. Inside a factory paired with `onDispose`, manual disposal is acceptable — disable the rule on that line with a short comment explaining why.

## Physical Stores with `defineStore`

A **physical store** implements the minimal CRUD contract (`add`, `update`, `remove`, `find`, `get`, `count`). `defineStore` wraps a `defineService({ lifetime: 'singleton' })` call, attaches model/primaryKey metadata, and auto-disposes the store on injector teardown.

```typescript
import { defineStore, InMemoryStore } from '@furystack/core'

class User {
  declare username: string
  declare displayName: string
}

export const UserStore = defineStore({
  name: 'my-app/UserStore',
  model: User,
  primaryKey: 'username',
  factory: () => new InMemoryStore({ model: User, primaryKey: 'username' }),
})

const store = injector.get(UserStore)
```

### Throw-by-Default Stores

Stores shipped by FuryStack packages default to a factory that throws a `NotConfiguredError`. Applications must bind a persistent implementation before resolving anything that depends on them:

```typescript
import { UserStore } from '@furystack/rest-service'
import { defineSequelizeStore } from '@furystack/sequelize-store'

injector.bind(UserStore, () => /* your persistent store factory */)
```

Tests opt into `InMemoryStore` per injector:

```typescript
injector.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))
```

This pattern replaces the old implicit `addStore(...)` side-effect registration.

### Dedicated Store Adapters

Backend packages expose `defineXxxStore` helpers that return a `StoreToken`:

- `defineFileSystemStore<T, PK>({ name, model, primaryKey, fileName, tickMs? })`
- `defineMongoDbStore<T, PK>({ name, model, primaryKey, url, db, collection, options? })`
- `defineSequelizeStore<T, M, PK>({ name, model, sequelizeModel, primaryKey, options, initModel? })`
- `defineRedisStore<T, PK>({ name, model, primaryKey, client })`

TypeScript often collapses the `const TPrimaryKey extends keyof T` generic when it flows through a wrapper. If inference widens the token to `keyof T`, pass explicit generics:

```typescript
const MyStore = defineFileSystemStore<User, 'username'>({ ... })
```

## DataSets with `defineDataSet`

A **DataSet** wraps a store with authorization, modification hooks, and change events. It is the recommended write gateway for entity mutations — bypassing it bypasses authorization, hooks, and entity-sync notifications.

```typescript
import { defineDataSet } from '@furystack/repository'

export const UserDataSet = defineDataSet({
  name: 'my-app/UserDataSet',
  store: UserStore,
  settings: {
    onEntityAdded: ({ injector, entity }) => {
      // ...
    },
    authorizeUpdate: async ({ entity }) => ({
      isAllowed: entity.username !== 'system',
      message: 'Cannot update the system user',
    }),
  },
})
```

Resolve via `injector.get(UserDataSet)` or the legacy-compatible `getDataSetFor`:

```typescript
import { getDataSetFor } from '@furystack/repository'

const dataSet = getDataSetFor(injector, UserDataSet)
await dataSet.add(injector, { username: 'alice', displayName: 'Alice' })
```

### Passing DataSet tokens to helpers

Endpoint generators and registration helpers take `DataSetToken` directly (no more `{ model, primaryKey }` tuples):

```typescript
createGetCollectionEndpoint(UserDataSet)
useEntitySync(injector, { models: [UserDataSet, OrderDataSet] })
```

### Type-inference gotcha (same shape as `defineStore`)

Inline callback settings widen `TPrimaryKey` back to `keyof T`. Fix by annotating the callback's `entity` parameter or passing the triple generic:

```typescript
defineDataSet<User, 'username', WithOptionalId<User, 'username'>>({ ... })
```

## Observable Patterns

### ObservableValue

Create reactive values with `ObservableValue`:

```typescript
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
import { defineService } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { User } from './models/user.js'

export type SessionService = {
  /** Observable of the current user. */
  currentUser: ObservableValue<User | null>
}

export const SessionServiceToken = defineService({
  name: 'my-app/SessionService',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const currentUser = new ObservableValue<User | null>(null)
    onDispose(() => currentUser[Symbol.dispose]())
    return { currentUser } satisfies SessionService
  },
})
```

## Disposable Resources

### Implement `Symbol.dispose`

Any class that holds resources should implement disposal:

```typescript
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

Implement cache with proper generics:

```typescript
export class Cache<TArgs extends unknown[], TResult> {
  private cache = new Map<string, CachedValue<TResult>>()

  constructor(private options: CacheOptions<TArgs, TResult>) {}

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

The `rest-action-use-request-error` lint rule enforces throwing `RequestError` (not plain `Error`) in REST action files. `RequestError` accepts a message, an HTTP status code, and optional details:

```typescript
throw new RequestError('Email is required', 400)
```

## Breaking Changes

### Semantic Versioning

Follow semantic versioning strictly:

- **Major** (x.0.0): Breaking changes to public API
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

### Deprecation Pattern

Deprecate before removing:

```typescript
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

All public APIs must have clear JSDoc with an example when the usage is not obvious:

````typescript
/**
 * Defines a singleton service token.
 *
 * @param options - Configuration options
 * @returns A token that can be resolved via `injector.get(...)`
 *
 * @example
 * ```typescript
 * const Counter = defineService({
 *   name: 'my-app/Counter',
 *   lifetime: 'singleton',
 *   factory: () => ({ value: 0 }),
 * })
 * const counter = injector.get(Counter)
 * ```
 */
export const defineService: <TService, TLifetime extends Lifetime>(
  options: DefineServiceOptions<TService, TLifetime>,
) => Token<TService, TLifetime, false>
````

## Shades Rendering Patterns

### Removed APIs

The `no-removed-shade-apis` lint rule enforces this. In short: `element` is removed from `RenderOptions` (use `useHostProps` / `useRef`), and `onAttach` / `onDetach` are removed from `ShadeOptions` (use `useDisposable`).

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

### Local State: `useState` over Manual `ObservableValue`

The `prefer-use-state` lint rule enforces using `useState` instead of manually combining `useDisposable` + `ObservableValue` + `useObservable` for local component state. Reserve `useDisposable` + `ObservableValue` for cases where the observable must be passed to a service or shared across component boundaries (not just parent-to-child). For parent-to-child state, prefer plain props.

### Module-Level JSX Constants

The `no-module-level-jsx` lint rule forbids storing JSX elements in module-level constants. JSX creates VNode objects; reusing the same instance across mounts causes duplication bugs because Shades associates DOM nodes with VNodes. Use factory functions instead. Plain data (strings, numbers, objects without JSX) at module level is fine.

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
  customElementName: 'my-button',
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
  customElementName: 'my-button',
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

#### CSS States

The `no-css-state-hooks` lint rule forbids using `useState` for hover, focus, or active states. Use `css` pseudo-selectors (`&:hover`, `&:focus`, `&:active`) instead.

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
import { cssVariableTheme } from '@furystack/shades-common-components'

const MyComponent = Shade({
  customElementName: 'my-component',
  css: {
    color: cssVariableTheme.text.primary,
    backgroundColor: cssVariableTheme.background.paper,
    borderColor: cssVariableTheme.palette.primary.main,
    boxShadow: `0 0 0 2px ${cssVariableTheme.palette.primary.main} inset`,
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
// packages/core/src/index.ts
export { defineStore } from './define-store.js'
export type { StoreToken } from './define-store.js'
export { useSystemIdentityContext } from './system-identity-context.js'
export { InMemoryStore } from './in-memory-store.js'
// ...
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

## Data Access: DataSet over StoreToken

The `no-direct-store-token` lint rule enforces resolving a `DataSetToken` (via `injector.get(...)` or `getDataSetFor(...)`) rather than resolving the underlying `StoreToken` directly in application code. Direct physical-store access bypasses authorization, modification hooks, DataSet events, and entity sync.

```typescript
// ✅ Good — use DataSet via its token
import { getDataSetFor } from '@furystack/repository'
import { useSystemIdentityContext } from '@furystack/core'

await usingAsync(useSystemIdentityContext({ injector, username: 'MyService' }), async (systemInjector) => {
  const dataSet = getDataSetFor(systemInjector, UserDataSet)
  await dataSet.add(systemInjector, entity)
  await dataSet.find(systemInjector, { filter: { ... } })
})
```

### When to use a `StoreToken` directly

- **Store implementations** (e.g. `InMemoryStore`, `SequelizeStore`) — testing the store layer itself
- **Inside a DataSet factory** — the DataSet resolves its backing store via the token internally
- **Test data seeding** — acceptable in test setup to seed data into the physical store

### Setup helpers

Setup helpers configure throw-by-default tokens for the APIs they expose. Callers must run them on the injector before resolving anything downstream:

```typescript
useHttpAuthentication(injector) // configures HttpAuthenticationSettings + HttpUserContext dependencies
useJwtAuthentication(injector, { secret: '...' }) // configures JwtAuthenticationSettings + JwtTokenService
usePasswordPolicy(injector) // configures PasswordAuthenticator + CryptoPasswordHasher defaults
```

## Summary

**Key Principles:**

1. **Public API first** — design for library users
2. **Functional DI** — `defineService` / `defineStore` / `defineDataSet`, token-based resolution
3. **Observable patterns** — `ObservableValue` for reactive state
4. **Disposable resources** — `Symbol.dispose` / `onDispose` factory hooks
5. **Type safety** — no `any`, explicit types for public APIs
6. **Semantic versioning** — followed strictly for all changes
7. **Deprecation** — deprecate before removing
8. **Documentation** — JSDoc on all public APIs
9. **No side effects** — package imports must be safe
10. **Test coverage** — 100% for public APIs

**Library Development Checklist:**

- [ ] Services declared via `defineService` / `defineServiceAsync` with explicit lifetimes
- [ ] Stateful resources own their teardown via `ctx.onDispose`
- [ ] `defineStore` + throw-by-default pattern for persistent data
- [ ] `defineDataSet` for write gateways; app code resolves the DataSet token, not the underlying store
- [ ] `ObservableValue` for reactive state; owner class implements `Symbol.dispose`
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
