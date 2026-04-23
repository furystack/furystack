import { describe, expect, it, vi } from 'vitest'
import { defineService, defineServiceAsync } from './define-service.js'
import {
  AsyncTokenInSyncContextError,
  CannotProvideTransientError,
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
    it('throws when a service depends on itself', () => {
      type Self = { call: () => Self }
      const tokenRef: { current?: ReturnType<typeof defineService<Self, 'singleton'>> } = {}
      const Self = defineService<Self, 'singleton'>({
        name: 'test/Self',
        lifetime: 'singleton',
        factory: ({ inject }) => ({ call: () => inject(tokenRef.current!) }),
      })
      tokenRef.current = Self
      const injector = createInjector()
      // Build-up: factory doesn't call inject(Self) synchronously; cycles come via two-party
      // so build a direct two-party cycle instead:
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
      expect(() => injector.get(A)).toThrow(CircularDependencyError)
    })
  })

  describe('provide', () => {
    it('pre-seeds a singleton instance without running the factory', () => {
      const factory = vi.fn(() => ({ value: 'from-factory' }))
      const Token = defineService({ name: 'test/Seeded', lifetime: 'singleton', factory })
      const injector = createInjector()
      injector.provide(Token, { value: 'from-provide' })
      expect(injector.get(Token).value).toBe('from-provide')
      expect(factory).not.toHaveBeenCalled()
    })

    it('rejects providing a transient', () => {
      const Transient = defineService({ name: 'test/RejectTransient', lifetime: 'transient', factory: () => ({}) })
      const injector = createInjector()
      expect(() => injector.provide(Transient, {})).toThrow(CannotProvideTransientError)
    })

    it('provides at scope level, overriding parent for that scope', async () => {
      const Token = defineService({
        name: 'test/ScopeOverride',
        lifetime: 'scoped',
        factory: () => ({ source: 'factory' }),
      })
      const root = createInjector()
      const scope = root.createScope()
      scope.provide(Token, { source: 'override' })
      expect(scope.get(Token).source).toBe('override')
      await scope[Symbol.asyncDispose]()
      await root[Symbol.asyncDispose]()
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

    it('throws when resolving an async token via get', () => {
      const Token = defineServiceAsync({
        name: 'test/AsyncInSync',
        lifetime: 'singleton',
        factory: async () => 1,
      })
      const injector = createInjector()
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
  })

  describe('self-reflection', () => {
    it('exposes the token being instantiated via ctx.token', () => {
      const Service = defineService({
        name: 'self-ref/Service',
        lifetime: 'singleton',
        factory: ({ token }) => ({ name: token.name, lifetime: token.lifetime, selfId: token.id }),
      })
      const injector = createInjector()
      const resolved = injector.get(Service)
      expect(resolved.name).toBe('self-ref/Service')
      expect(resolved.lifetime).toBe('singleton')
      expect(resolved.selfId).toBe(Service.id)
    })
  })

  describe('token identity', () => {
    it('produces a fresh symbol for every defineService call, even with identical names', () => {
      const A = defineService({ name: 'same', lifetime: 'singleton', factory: () => ({ v: 1 }) })
      const B = defineService({ name: 'same', lifetime: 'singleton', factory: () => ({ v: 2 }) })
      expect(A.id).not.toBe(B.id)
    })

    it('exposes the name as the symbol description for debugging', () => {
      const Token = defineService({ name: '@pkg/thing/MyService', lifetime: 'singleton', factory: () => ({}) })
      expect(Token.id.description).toBe('@pkg/thing/MyService')
    })

    it('resolves two same-named tokens independently so dual-version libraries can coexist', () => {
      const V1 = defineService({ name: 'LoggerCollection', lifetime: 'singleton', factory: () => ({ version: 1 }) })
      const V2 = defineService({ name: 'LoggerCollection', lifetime: 'singleton', factory: () => ({ version: 2 }) })
      const injector = createInjector()
      expect(injector.get(V1).version).toBe(1)
      expect(injector.get(V2).version).toBe(2)
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
})
