# @furystack/inject

Functional dependency injection for FuryStack. Tokens, not decorators.

## Installation

```bash
npm install @furystack/inject
# or
yarn add @furystack/inject
```

## Injector

An `Injector` is a container: it resolves tokens to service instances, caches
them according to their declared lifetime, and disposes everything it
instantiated when it itself is disposed. Create one via `createInjector()`:

```ts
import { createInjector } from '@furystack/inject'

const myInjector = createInjector()
```

Child scopes — used for per-request, per-connection, or per-test state — are
created with `.createScope(...)`:

```ts
const scope = myInjector.createScope({ owner: 'myCustomContext' })
```

A scope is itself an `Injector`. Scoped-lifetime tokens resolved on a scope are
cached on that scope; disposing the scope runs every `onDispose` callback its
factories registered.

The `withScope(parent, async (scope) => ...)` helper creates a scope, runs the
callback, and disposes the scope in `finally`:

```ts
import { withScope } from '@furystack/inject'

await withScope(myInjector, async (scope) => {
  const svc = scope.get(MyService)
  // ...
})
```

## Defining Services

Services are declared with `defineService` / `defineServiceAsync`, which each
return an opaque **token**. The token carries the factory and lifetime; the
caller never constructs the service directly.

```ts
import { defineService } from '@furystack/inject'

export const MyService = defineService({
  name: 'my-app/MyService',
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
- `lifetime` is required; pick one of `singleton` / `scoped` / `transient`.
- `factory` receives a `ServiceContext` and returns the service instance.

### Lifetimes

- **transient** — a new instance every resolution. Not cached.
- **scoped** — one instance per scope. Cached on the first injector that resolves it.
- **singleton** — one instance for the whole injector tree. Cached at the root.

Type-level rule: a `singleton` factory can only depend on other `singleton`
tokens. The `ctx.inject` resolver is refined per-lifetime, so mis-scoped
dependencies are a compile-time error.

### Resolving Dependencies

Inside a factory, pull dependencies via `ctx.inject` / `ctx.injectAsync`:

```ts
import { defineService } from '@furystack/inject'

const Logger = defineService({
  name: 'my-app/Logger',
  lifetime: 'singleton',
  factory: () => ({ log: (m: string) => console.log(m) }),
})

export const UserService = defineService({
  name: 'my-app/UserService',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const logger = inject(Logger)
    return {
      greet: (name: string) => logger.log(`hello ${name}`),
    }
  },
})
```

Outside a factory, resolve via `injector.get(token)` (or `.getAsync(token)` for
async tokens):

```ts
const userService = myInjector.get(UserService)
userService.greet('alice')
```

### Disposal

Factories register teardown with `ctx.onDispose`. Callbacks run in LIFO order
on `injector[Symbol.asyncDispose]()`:

```ts
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

### Overrides — `bind` + `invalidate`

`injector.bind(token, factory)` installs a factory override on the injector
that owns the cached instance for that token (root for singletons, this
injector for scoped/transient). Any previously cached instance is dropped.

```ts
// Wire a persistent store behind a throw-by-default token at app bootstrap
injector.bind(UserStore, () => new SequelizeStore({ model: User, primaryKey: 'username', ... }))

// Reconfigure a settings token, then drop the dependent service cache
injector.bind(LocationServiceSettings, () => ({ ...custom }))
injector.invalidate(LocationService)
```

In tests, `bind` replaces the old `setExplicitInstance(...)` pattern and is
the preferred way to substitute mocks:

```ts
injector.bind(DependencyToken, () => mockDependency)
```

### Async Services

Use `defineServiceAsync` when the factory must await I/O. Async tokens can
only be resolved via `injector.getAsync(...)`; the sync `get` rejects them at
compile time.

```ts
const Config = defineServiceAsync({
  name: 'my-app/Config',
  lifetime: 'singleton',
  factory: async () => JSON.parse(await fs.readFile('./config.json', 'utf8')),
})

const config = await myInjector.getAsync(Config)
```

## A few things to care about

**Circular imports:** If two modules each import the other's token, one may
be undefined at resolution time. TypeScript won't complain; you'll get
`Cannot read properties of undefined (reading 'factory')` at runtime. Break
the cycle via a lazy import or by splitting the shared dependency into its
own module.

**Lifetime invariants:** A service can depend only on tokens with a
longer-or-equal lifetime than its own. The type of `ctx.inject` enforces the
singleton → singleton rule at compile time; scoped/transient dependencies
flow naturally.

**Scope caching gotcha:** `findCached` walks the scope parent chain. If a
setup step resolves a scoped token on an ancestor (commonly on the root),
every descendant scope returns that same cached instance. Do setup inside a
short-lived scope, or store per-scope state in a `WeakMap` keyed by a
per-scope identity rather than on the service instance.

**Extending the injector surface:** The `useXxx` helpers exported by other
FuryStack packages (`useRestService`, `useHttpAuthentication`,
`useJwtAuthentication`, …) do not run inside a factory. They internally use
a scoped `CleanupRegistry` token to register disposal without a `ServiceContext`.
Follow the same pattern when authoring your own setup helpers — see
`packages/websocket-api/src/use-websocket-api.ts` for a reference.
