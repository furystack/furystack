import { describe, expect, it, vi } from 'vitest'
import { defineService, defineServiceAsync } from './define-service.js'
import {
  AsyncTokenInSyncContextError,
  CircularDependencyError,
  createInjector,
  Injector,
  InjectorDisposedError,
  InvalidLifetimeDependencyError,
  withScope,
} from './injector.js'

describe('Injector', () => {
  describe('defineService / basic resolution', () => {
    it('resolves a transient service with a fresh instance per call', () => {
      const Counter = defineService({
        name: 'test/Counter',
        lifetime: 'transient',
        factory: () => ({ id: Math.random() }),
      })
      const injector = createInjector()
      const a = injector.get(Counter)
      const b = injector.get(Counter)
      expect(a).not.toBe(b)
    })

    it('resolves a singleton service as the same instance every time', () => {
      const Singleton = defineService({
        name: 'test/Singleton',
        lifetime: 'singleton',
        factory: () => ({ marker: 1 }),
      })
      const injector = createInjector()
      expect(injector.get(Singleton)).toBe(injector.get(Singleton))
    })

    it('resolves a scoped service as per-scope', async () => {
      const Scoped = defineService({
        name: 'test/Scoped',
        lifetime: 'scoped',
        factory: () => ({ marker: {} }),
      })
      const root = createInjector()
      const childA = root.createScope()
      const childB = root.createScope()
      expect(childA.get(Scoped)).toBe(childA.get(Scoped))
      expect(childA.get(Scoped)).not.toBe(childB.get(Scoped))
      await childA[Symbol.asyncDispose]()
      await childB[Symbol.asyncDispose]()
      await root[Symbol.asyncDispose]()
    })

    it('caches singletons at the root regardless of requesting scope', async () => {
      const Single = defineService({
        name: 'test/Single',
        lifetime: 'singleton',
        factory: () => ({ id: 42 }),
      })
      const root = createInjector()
      const child = root.createScope()
      const fromChild = child.get(Single)
      const fromRoot = root.get(Single)
      expect(fromChild).toBe(fromRoot)
      await child[Symbol.asyncDispose]()
      await root[Symbol.asyncDispose]()
    })

    it('runs the factory only once per singleton', () => {
      const factory = vi.fn(() => ({}))
      const Token = defineService({ name: 'test/OnceSingleton', lifetime: 'singleton', factory })
      const injector = createInjector()
      injector.get(Token)
      injector.get(Token)
      injector.get(Token)
      expect(factory).toHaveBeenCalledTimes(1)
    })
  })

  describe('inject dependency chain', () => {
    it('injects a singleton dep into a singleton parent', () => {
      const Dep = defineService({ name: 'test/Dep', lifetime: 'singleton', factory: () => ({ value: 'dep' }) })
      const Parent = defineService({
        name: 'test/Parent',
        lifetime: 'singleton',
        factory: ({ inject }) => ({ dep: inject(Dep) }),
      })
      const injector = createInjector()
      const parent = injector.get(Parent)
      expect(parent.dep).toBe(injector.get(Dep))
    })

    it('rejects singleton depending on scoped', () => {
      const Scoped = defineService({ name: 'test/S', lifetime: 'scoped', factory: () => ({}) })
      const Singleton = defineService({
        name: 'test/Singleton2',
        lifetime: 'singleton',
        factory: ({ inject }) => inject(Scoped as never),
      })
      const injector = createInjector()
      expect(() => injector.get(Singleton)).toThrow(InvalidLifetimeDependencyError)
    })

    it('rejects scoped depending on transient', () => {
      const Transient = defineService({ name: 'test/T', lifetime: 'transient', factory: () => ({}) })
      const Scoped = defineService({
        name: 'test/S2',
        lifetime: 'scoped',
        factory: ({ inject }) => inject(Transient as never),
      })
      const injector = createInjector()
      expect(() => injector.get(Scoped)).toThrow(InvalidLifetimeDependencyError)
    })

    it('allows transient depending on any lifetime', () => {
      const Scoped = defineService({ name: 'test/ScopedA', lifetime: 'scoped', factory: () => ({ s: 1 }) })
      const Singleton = defineService({ name: 'test/SingletonA', lifetime: 'singleton', factory: () => ({ sg: 1 }) })
      const Transient = defineService({
        name: 'test/TransientA',
        lifetime: 'transient',
        factory: ({ inject }) => ({ a: inject(Scoped), b: inject(Singleton) }),
      })
      const injector = createInjector()
      const t = injector.get(Transient)
      expect(t.a.s).toBe(1)
      expect(t.b.sg).toBe(1)
    })
  })

  describe('circular dependencies', () => {
    it('throws when a service depends on itself via a two-party cycle', () => {
      type A = { name: string }
      const refs: {
        a?: ReturnType<typeof defineService<A, 'singleton'>>
        b?: ReturnType<typeof defineService<A, 'singleton'>>
      } = {}
      const A = defineService<A, 'singleton'>({
        name: 'test/CycleA',
        lifetime: 'singleton',
        factory: ({ inject }) => {
          inject(refs.b!)
          return { name: 'a' }
        },
      })
      const B = defineService<A, 'singleton'>({
        name: 'test/CycleB',
        lifetime: 'singleton',
        factory: ({ inject }) => {
          inject(refs.a!)
          return { name: 'b' }
        },
      })
      refs.a = A
      refs.b = B
      const injector = createInjector()
      expect(() => injector.get(A)).toThrow(CircularDependencyError)
    })

    it('does not cross-contaminate cycle tracking across independent top-level resolves', () => {
      const Inner = defineService({
        name: 'test/CycleIndependentInner',
        lifetime: 'transient',
        factory: () => ({ ok: true }),
      })
      const Outer = defineService({
        name: 'test/CycleIndependentOuter',
        lifetime: 'transient',
        factory: ({ inject }) => ({ inner: inject(Inner) }),
      })
      const injector = createInjector()
      expect(injector.get(Outer).inner.ok).toBe(true)
      expect(injector.get(Outer).inner.ok).toBe(true)
    })
  })

  describe('bind', () => {
    it('overrides a singleton factory before resolution', () => {
      const Token = defineService({
        name: 'test/BindSingleton',
        lifetime: 'singleton',
        factory: () => ({ source: 'default' }),
      })
      const injector = createInjector()
      injector.bind(Token, () => ({ source: 'override' }))
      expect(injector.get(Token).source).toBe('override')
    })

    it('overrides a scoped factory at the binding scope only', async () => {
      const Token = defineService({
        name: 'test/BindScoped',
        lifetime: 'scoped',
        factory: () => ({ source: 'default' }),
      })
      const root = createInjector()
      const scope = root.createScope()
      scope.bind(Token, () => ({ source: 'override' }))
      expect(scope.get(Token).source).toBe('override')
      expect(root.get(Token).source).toBe('default')
      await scope[Symbol.asyncDispose]()
      await root[Symbol.asyncDispose]()
    })

    it('rebinding drops any cached instance so the next get runs the new factory', () => {
      const Token = defineService({
        name: 'test/BindReplaces',
        lifetime: 'singleton',
        factory: () => ({ source: 'default' }),
      })
      const injector = createInjector()
      expect(injector.get(Token).source).toBe('default')
      injector.bind(Token, () => ({ source: 'override' }))
      expect(injector.get(Token).source).toBe('override')
    })

    it('binds a singleton at the root even when called on a child scope', async () => {
      const Token = defineService({
        name: 'test/BindSingletonFromScope',
        lifetime: 'singleton',
        factory: () => ({ source: 'default' }),
      })
      const root = createInjector()
      const scope = root.createScope()
      scope.bind(Token, () => ({ source: 'override' }))
      expect(root.get(Token).source).toBe('override')
      await scope[Symbol.asyncDispose]()
      await root[Symbol.asyncDispose]()
    })

    it('binds an async factory for an async token', async () => {
      const Token = defineServiceAsync({
        name: 'test/BindAsync',
        lifetime: 'singleton',
        factory: async () => ({ source: 'default' }),
      })
      const injector = createInjector()
      injector.bind(Token, async () => ({ source: 'override' }))
      const value = await injector.getAsync(Token)
      expect(value.source).toBe('override')
    })
  })

  describe('invalidate', () => {
    it('clears a cached resolved instance so the next get re-runs the factory', () => {
      let counter = 0
      const Token = defineService({
        name: 'test/InvalidateResolved',
        lifetime: 'singleton',
        factory: () => ({ id: ++counter }),
      })
      const injector = createInjector()
      expect(injector.get(Token).id).toBe(1)
      injector.invalidate(Token)
      expect(injector.get(Token).id).toBe(2)
    })

    it('clears a cached failure so a retry gets a fresh attempt', () => {
      let calls = 0
      const Token = defineService({
        name: 'test/InvalidateFailed',
        lifetime: 'singleton',
        factory: () => {
          calls += 1
          if (calls === 1) {
            throw new Error('boom')
          }
          return { ok: true }
        },
      })
      const injector = createInjector()
      expect(() => injector.get(Token)).toThrow('boom')
      injector.invalidate(Token)
      expect(injector.get(Token).ok).toBe(true)
      expect(calls).toBe(2)
    })

    it('is a no-op for tokens that have never been resolved', () => {
      const Token = defineService({
        name: 'test/InvalidateUnresolved',
        lifetime: 'singleton',
        factory: () => ({}),
      })
      const injector = createInjector()
      expect(() => injector.invalidate(Token)).not.toThrow()
    })
  })

  describe('error caching', () => {
    it('caches a factory error and rethrows on subsequent gets', () => {
      const factory = vi.fn(() => {
        throw new Error('boom')
      })
      const Token = defineService({ name: 'test/Boom', lifetime: 'singleton', factory })
      const injector = createInjector()
      expect(() => injector.get(Token)).toThrow('boom')
      expect(() => injector.get(Token)).toThrow('boom')
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('retries transient factories because they are not cached', () => {
      const factory = vi.fn(() => {
        throw new Error('boom')
      })
      const Token = defineService({ name: 'test/BoomTransient', lifetime: 'transient', factory })
      const injector = createInjector()
      expect(() => injector.get(Token)).toThrow('boom')
      expect(() => injector.get(Token)).toThrow('boom')
      expect(factory).toHaveBeenCalledTimes(2)
    })
  })

  describe('disposal', () => {
    it('runs onDispose callbacks in LIFO order', async () => {
      const order: number[] = []
      const First = defineService({
        name: 'test/DisposeFirst',
        lifetime: 'singleton',
        factory: ({ onDispose }) => {
          onDispose(() => {
            order.push(1)
          })
          return {}
        },
      })
      const Second = defineService({
        name: 'test/DisposeSecond',
        lifetime: 'singleton',
        factory: ({ onDispose, inject }) => {
          inject(First)
          onDispose(() => {
            order.push(2)
          })
          return {}
        },
      })
      const injector = createInjector()
      injector.get(Second)
      await injector[Symbol.asyncDispose]()
      expect(order).toEqual([2, 1])
    })

    it('awaits async onDispose callbacks', async () => {
      const order: string[] = []
      const Token = defineService({
        name: 'test/AsyncDispose',
        lifetime: 'singleton',
        factory: ({ onDispose }) => {
          onDispose(async () => {
            await new Promise((r) => setTimeout(r, 10))
            order.push('done')
          })
          return {}
        },
      })
      const injector = createInjector()
      injector.get(Token)
      await injector[Symbol.asyncDispose]()
      expect(order).toEqual(['done'])
    })

    it('aggregates errors thrown by dispose callbacks', async () => {
      const Token = defineService({
        name: 'test/DisposeError',
        lifetime: 'singleton',
        factory: ({ onDispose }) => {
          onDispose(() => {
            throw new Error('dispose-fail')
          })
          return {}
        },
      })
      const injector = createInjector()
      injector.get(Token)
      await expect(injector[Symbol.asyncDispose]()).rejects.toBeInstanceOf(AggregateError)
    })

    it('throws when operating on a disposed injector', async () => {
      const injector = createInjector()
      await injector[Symbol.asyncDispose]()
      const Token = defineService({ name: 'test/AfterDispose', lifetime: 'singleton', factory: () => ({}) })
      expect(() => injector.get(Token)).toThrow(InjectorDisposedError)
    })

    it('is idempotent: disposing twice resolves silently', async () => {
      const injector = createInjector()
      await injector[Symbol.asyncDispose]()
      await expect(injector[Symbol.asyncDispose]()).resolves.toBeUndefined()
    })

    it('only runs dispose callbacks once across multiple dispose calls', async () => {
      const cb = vi.fn()
      const Token = defineService({
        name: 'test/DisposeOnce',
        lifetime: 'singleton',
        factory: ({ onDispose }) => {
          onDispose(cb)
          return {}
        },
      })
      const injector = createInjector()
      injector.get(Token)
      await injector[Symbol.asyncDispose]()
      await injector[Symbol.asyncDispose]()
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })

  describe('withScope', () => {
    it('disposes the scope when the callback resolves', async () => {
      const disposed: string[] = []
      const Scoped = defineService({
        name: 'test/WithScopeOK',
        lifetime: 'scoped',
        factory: ({ onDispose }) => {
          onDispose(() => {
            disposed.push('ok')
          })
          return {}
        },
      })
      const root = createInjector()
      await withScope(root, async (scope) => {
        scope.get(Scoped)
      })
      expect(disposed).toEqual(['ok'])
      await root[Symbol.asyncDispose]()
    })

    it('disposes the scope even when the callback throws', async () => {
      const disposed: string[] = []
      const Scoped = defineService({
        name: 'test/WithScopeThrow',
        lifetime: 'scoped',
        factory: ({ onDispose }) => {
          onDispose(() => {
            disposed.push('threw')
          })
          return {}
        },
      })
      const root = createInjector()
      await expect(
        withScope(root, (scope) => {
          scope.get(Scoped)
          throw new Error('nope')
        }),
      ).rejects.toThrow('nope')
      expect(disposed).toEqual(['threw'])
      await root[Symbol.asyncDispose]()
    })
  })

  describe('async factories', () => {
    it('resolves an async service via getAsync', async () => {
      const Token = defineServiceAsync({
        name: 'test/AsyncValue',
        lifetime: 'singleton',
        factory: async () => {
          await Promise.resolve()
          return { value: 1 }
        },
      })
      const injector = createInjector()
      const value = await injector.getAsync(Token)
      expect(value.value).toBe(1)
    })

    it('rejects async tokens at the type level for injector.get', () => {
      const Token = defineServiceAsync({
        name: 'test/AsyncInSync',
        lifetime: 'singleton',
        factory: async () => 1,
      })
      const injector = createInjector()
      // @ts-expect-error async tokens cannot be resolved via the sync get
      expect(() => injector.get(Token)).toThrow(AsyncTokenInSyncContextError)
    })

    it('shares the pending promise between concurrent callers', async () => {
      let resolves = 0
      const Token = defineServiceAsync({
        name: 'test/AsyncShared',
        lifetime: 'singleton',
        factory: async () => {
          resolves += 1
          await new Promise((r) => setTimeout(r, 5))
          return { id: resolves }
        },
      })
      const injector = createInjector()
      const [a, b] = await Promise.all([injector.getAsync(Token), injector.getAsync(Token)])
      expect(resolves).toBe(1)
      expect(a).toBe(b)
    })

    it('caches async errors and rethrows on later getAsync calls', async () => {
      let calls = 0
      const Token = defineServiceAsync({
        name: 'test/AsyncBoom',
        lifetime: 'singleton',
        factory: async () => {
          calls += 1
          throw new Error('async-boom')
        },
      })
      const injector = createInjector()
      await expect(injector.getAsync(Token)).rejects.toThrow('async-boom')
      await expect(injector.getAsync(Token)).rejects.toThrow('async-boom')
      expect(calls).toBe(1)
    })

    it('resolves sync tokens through getAsync', async () => {
      const Token = defineService({
        name: 'test/SyncViaGetAsync',
        lifetime: 'singleton',
        factory: () => ({ value: 7 }),
      })
      const injector = createInjector()
      const value = await injector.getAsync(Token)
      expect(value.value).toBe(7)
    })

    it('caches a sync throw raised from inside an async factory and rethrows on subsequent getAsync', async () => {
      const factory = vi.fn(() => {
        throw new Error('async-sync-boom')
      })
      const Token = defineServiceAsync({
        name: 'test/AsyncSyncThrow',
        lifetime: 'singleton',
        factory,
      })
      const injector = createInjector()
      await expect(injector.getAsync(Token)).rejects.toThrow('async-sync-boom')
      await expect(injector.getAsync(Token)).rejects.toThrow('async-sync-boom')
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('detects cycles that form across async boundaries', async () => {
      type Node = { name: string }
      const refs: {
        a?: ReturnType<typeof defineServiceAsync<Node, 'singleton'>>
        b?: ReturnType<typeof defineServiceAsync<Node, 'singleton'>>
      } = {}
      const A = defineServiceAsync<Node, 'singleton'>({
        name: 'test/AsyncCycleA',
        lifetime: 'singleton',
        factory: async ({ injectAsync }) => {
          await Promise.resolve()
          await injectAsync(refs.b!)
          return { name: 'a' }
        },
      })
      const B = defineServiceAsync<Node, 'singleton'>({
        name: 'test/AsyncCycleB',
        lifetime: 'singleton',
        factory: async ({ injectAsync }) => {
          await Promise.resolve()
          await injectAsync(refs.a!)
          return { name: 'b' }
        },
      })
      refs.a = A
      refs.b = B
      const injector = createInjector()
      await expect(injector.getAsync(A)).rejects.toBeInstanceOf(CircularDependencyError)
    })
  })

  describe('token identity', () => {
    it('mints a distinct symbol per defineService call even when names match', () => {
      const A = defineService({ name: 'pkg/Same', lifetime: 'singleton', factory: () => ({ v: 1 }) })
      const B = defineService({ name: 'pkg/Same', lifetime: 'singleton', factory: () => ({ v: 2 }) })
      expect(A.id).not.toBe(B.id)
    })
  })

  describe('createScope', () => {
    it('exposes parent and owner', () => {
      const root = createInjector()
      const scope = root.createScope({ owner: 'request-1' })
      expect(scope.parent).toBe(root)
      expect(scope.owner).toBe('request-1')
      expect(root.parent).toBeNull()
    })

    it('supports constructing an Injector directly as an alternative', () => {
      const root = new Injector()
      expect(root.parent).toBeNull()
    })
  })

  describe('isResolved', () => {
    it('returns false before the token is resolved', () => {
      const T = defineService({ name: 'test/NotYet', lifetime: 'singleton', factory: () => ({}) })
      const injector = createInjector()
      expect(injector.isResolved(T)).toBe(false)
    })

    it('returns true after the token is resolved on the same injector', () => {
      const T = defineService({ name: 'test/Resolved', lifetime: 'singleton', factory: () => ({}) })
      const injector = createInjector()
      injector.get(T)
      expect(injector.isResolved(T)).toBe(true)
    })

    it('returns true from a child scope when the singleton was resolved at the root', () => {
      const T = defineService({ name: 'test/ResolvedRoot', lifetime: 'singleton', factory: () => ({}) })
      const root = createInjector()
      root.get(T)
      const scope = root.createScope()
      expect(scope.isResolved(T)).toBe(true)
    })

    it('returns true for async tokens that have already resolved', async () => {
      const T = defineServiceAsync({
        name: 'test/ResolvedAsync',
        lifetime: 'singleton',
        factory: async () => ({}),
      })
      const injector = createInjector()
      await injector.getAsync(T)
      expect(injector.isResolved(T)).toBe(true)
    })

    it('throws after disposal', async () => {
      const T = defineService({ name: 'test/DisposedCheck', lifetime: 'singleton', factory: () => ({}) })
      const injector = createInjector()
      await injector[Symbol.asyncDispose]()
      expect(() => injector.isResolved(T)).toThrow(InjectorDisposedError)
    })
  })

  describe('async lifetime and cache edge cases', () => {
    it('rejects an async dep with incompatible lifetime via injectAsync', async () => {
      const ScopedAsync = defineServiceAsync({
        name: 'test/AsyncScopedDep',
        lifetime: 'scoped',
        factory: async () => ({ marker: 1 }),
      })
      const SingletonAsync = defineServiceAsync({
        name: 'test/AsyncSingletonParent',
        lifetime: 'singleton',
        factory: async ({ injectAsync }) => {
          await injectAsync(ScopedAsync as never)
          return {}
        },
      })
      const injector = createInjector()
      await expect(injector.getAsync(SingletonAsync)).rejects.toBeInstanceOf(InvalidLifetimeDependencyError)
    })

    it('resolves an async singleton from a child scope by delegating to the root owner', async () => {
      const factory = vi.fn(async () => ({ id: 'once' }))
      const AsyncSingleton = defineServiceAsync({
        name: 'test/AsyncSingletonOwner',
        lifetime: 'singleton',
        factory,
      })
      const root = createInjector()
      const scope = root.createScope()
      const fromScope = await scope.getAsync(AsyncSingleton)
      const fromRoot = await root.getAsync(AsyncSingleton)
      expect(fromScope).toBe(fromRoot)
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('returns a cached async value synchronously via getAsync after first resolution', async () => {
      const AsyncSingleton = defineServiceAsync({
        name: 'test/AsyncCached',
        lifetime: 'singleton',
        factory: async () => ({ ready: true }),
      })
      const injector = createInjector()
      const first = await injector.getAsync(AsyncSingleton)
      const second = await injector.getAsync(AsyncSingleton)
      expect(second).toBe(first)
    })

    it('throws AsyncTokenInSyncContextError when a sync injector.get() hits a still-pending async cache entry', async () => {
      let release: (() => void) | undefined
      const Pending = defineServiceAsync({
        name: 'test/PendingAsyncForSync',
        lifetime: 'singleton',
        factory: () =>
          new Promise<{ ok: true }>((resolve) => {
            release = () => resolve({ ok: true })
          }),
      })
      // Sync-side consumer that reaches for the still-pending async entry
      // via inject(). `get` itself short-circuits async tokens, so this is
      // the path that actually exercises the `pending` branch of
      // `consumeCached` (sync context meets pending cache entry).
      const Consumer = defineService({
        name: 'test/SyncConsumerOfPending',
        lifetime: 'transient',
        factory: ({ inject }) => inject(Pending as never),
      })
      const injector = createInjector()
      const inflight = injector.getAsync(Pending)
      expect(() => injector.get(Consumer)).toThrow(AsyncTokenInSyncContextError)
      release?.()
      await inflight
    })
  })

  describe('scoped token cache isolation', () => {
    it('does not surface an ancestor scope cached value for a scoped token when a descendant rebinds', () => {
      // Regression: `findCached` used to walk the whole parent chain, so a
      // `null` cached at an ancestor scope (from resolving the scoped token
      // with its default factory) masked a descendant `bind()`. This
      // manifested as `injector.get(FormContextToken)` returning `null`
      // inside a `<Form>` when any `<Input>` had previously resolved the
      // same token outside a form on a sibling route.
      const Token = defineService<{ value: string } | null, 'scoped'>({
        name: 'test/ScopedDefaultNull',
        lifetime: 'scoped',
        factory: () => null,
      })
      const root = createInjector()
      expect(root.get(Token)).toBeNull()
      const child = root.createScope()
      child.bind(Token, () => ({ value: 'bound-on-child' }))
      expect(child.get(Token)).toEqual({ value: 'bound-on-child' })
      // Sanity: the ancestor still sees its own cached null -- rebinding
      // on the child must not reach up and overwrite the parent scope.
      expect(root.get(Token)).toBeNull()
    })

    it('gives each scope its own instance for scoped tokens that resolve via default factory', () => {
      const seeds: symbol[] = []
      const Token = defineService<{ id: symbol }, 'scoped'>({
        name: 'test/ScopedPerScope',
        lifetime: 'scoped',
        factory: () => {
          const id = Symbol('scoped-instance')
          seeds.push(id)
          return { id }
        },
      })
      const root = createInjector()
      const a = root.createScope()
      const b = root.createScope()
      const fromA = a.get(Token)
      const fromB = b.get(Token)
      const fromRoot = root.get(Token)
      expect(fromA).not.toBe(fromB)
      expect(fromA).not.toBe(fromRoot)
      expect(fromB).not.toBe(fromRoot)
      expect(seeds).toHaveLength(3)
    })

    it('still shares a single cached singleton across every scope in the chain', () => {
      const factory = vi.fn(() => ({ marker: 'once' }))
      const Token = defineService({
        name: 'test/SharedSingleton',
        lifetime: 'singleton',
        factory,
      })
      const root = createInjector()
      const a = root.createScope()
      const b = root.createScope()
      const fromA = a.get(Token)
      const fromB = b.get(Token)
      const fromRoot = root.get(Token)
      expect(fromA).toBe(fromB)
      expect(fromA).toBe(fromRoot)
      expect(factory).toHaveBeenCalledTimes(1)
    })
  })
})
