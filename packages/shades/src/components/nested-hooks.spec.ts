import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { LocationService } from '../services/location-service.js'
import { createNestedHooks, walkRoute } from './nested-hooks.js'
import type { NestedRoute } from './nested-router.js'

const makeComponent = () => null as unknown as JSX.Element

describe('walkRoute', () => {
  it('Should return the route when the pattern matches the path exactly', () => {
    const leaf = { component: () => makeComponent() }
    const routes = { '/users': leaf } satisfies Record<string, NestedRoute<any, any, any>>
    expect(walkRoute(routes, '/users')).toBe(leaf)
  })

  it('Should return undefined when no pattern matches', () => {
    const routes = { '/users': { component: () => makeComponent() } } satisfies Record<
      string,
      NestedRoute<any, any, any>
    >
    expect(walkRoute(routes, '/nonexistent')).toBeUndefined()
  })

  it('Should descend through a `/` root pattern transparently', () => {
    const leaf = { component: () => makeComponent() }
    const routes = {
      '/': {
        component: () => makeComponent(),
        children: {
          '/home': leaf,
        },
      },
    } satisfies Record<string, NestedRoute<any, any, any>>

    expect(walkRoute(routes, '/home')).toBe(leaf)
  })

  it('Should resolve a deeply nested path by walking children', () => {
    const leaf = { component: () => makeComponent() }
    const routes = {
      '/navigation': {
        component: () => makeComponent(),
        children: {
          '/tabs': leaf,
        },
      },
    } satisfies Record<string, NestedRoute<any, any, any>>

    expect(walkRoute(routes, '/navigation/tabs')).toBe(leaf)
  })

  it('Should resolve through two levels of `/` roots', () => {
    const leaf = { component: () => makeComponent() }
    const routes = {
      '/': {
        component: () => makeComponent(),
        children: {
          '/navigation': {
            component: () => makeComponent(),
            children: {
              '/tabs': leaf,
            },
          },
        },
      },
    } satisfies Record<string, NestedRoute<any, any, any>>

    expect(walkRoute(routes, '/navigation/tabs')).toBe(leaf)
  })

  it('Should match a parent prefix when the path is exactly the parent pattern', () => {
    const parent = {
      component: () => makeComponent(),
      children: {
        '/child': { component: () => makeComponent() },
      },
    }
    const routes = { '/parent': parent } satisfies Record<string, NestedRoute<any, any, any>>

    expect(walkRoute(routes, '/parent')).toBe(parent)
  })

  it('Should not confuse a prefix pattern that is not followed by a `/`', () => {
    const routes = {
      '/users': {
        component: () => makeComponent(),
        children: {
          '/:id': { component: () => makeComponent() },
        },
      },
    } satisfies Record<string, NestedRoute<any, any, any>>

    expect(walkRoute(routes, '/usersextra')).toBeUndefined()
  })
})

describe('createNestedHooks', () => {
  describe('getTypedQuery', () => {
    it('Should return null when the route has no declared query validator', async () => {
      const routes = {
        '/bare': { component: () => makeComponent() },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedQuery } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        expect(getTypedQuery(injector, '/bare')).toBeNull()
      })
    })

    it('Should return the validated query when the current search matches', async () => {
      const routes = {
        '/list': {
          component: () => makeComponent(),
          query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedQuery } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        const locationService = injector.get(LocationService)
        locationService.onDeserializedLocationSearchChanged.setValue({ page: 3 })
        expect(getTypedQuery(injector, '/list')).toEqual({ page: 3 })
      })
    })

    it('Should return null when the validator rejects the current search', async () => {
      const routes = {
        '/list': {
          component: () => makeComponent(),
          query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedQuery } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        const locationService = injector.get(LocationService)
        locationService.onDeserializedLocationSearchChanged.setValue({ page: 'not-a-number' })
        expect(getTypedQuery(injector, '/list')).toBeNull()
      })
    })
  })

  describe('getTypedHash', () => {
    it('Should return undefined when the route has no declared hash tuple', async () => {
      const routes = {
        '/bare': { component: () => makeComponent() },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        expect(getTypedHash(injector, '/bare')).toBeUndefined()
      })
    })

    it('Should return the current hash when it matches a declared literal', async () => {
      const routes = {
        '/tabs': {
          component: () => makeComponent(),
          hash: ['overview', 'details'] as const,
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        const locationService = injector.get(LocationService)
        locationService.onLocationHashChanged.setValue('details')
        expect(getTypedHash(injector, '/tabs')).toBe('details')
      })
    })

    it('Should return undefined when the current hash is not in the declared tuple', async () => {
      const routes = {
        '/tabs': {
          component: () => makeComponent(),
          hash: ['overview', 'details'] as const,
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        const locationService = injector.get(LocationService)
        locationService.onLocationHashChanged.setValue('something-else')
        expect(getTypedHash(injector, '/tabs')).toBeUndefined()
      })
    })

    it('Should resolve hashes through nested routes', async () => {
      const routes = {
        '/navigation': {
          component: () => makeComponent(),
          children: {
            '/tabs': {
              component: () => makeComponent(),
              hash: ['ctrl-1', 'ctrl-2'] as const,
            },
          },
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)

      await usingAsync(createInjector(), async (injector) => {
        const locationService = injector.get(LocationService)
        locationService.onLocationHashChanged.setValue('ctrl-1')
        expect(getTypedHash(injector, '/navigation/tabs')).toBe('ctrl-1')
      })
    })
  })

  describe('Type utilities', () => {
    it('Should narrow getTypedHash against the declared literal tuple', () => {
      const routes = {
        '/tabs': {
          component: () => makeComponent(),
          hash: ['overview', 'details'] as const,
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)
      expectTypeOf(getTypedHash<'/tabs'>).returns.toEqualTypeOf<'overview' | 'details' | undefined>()
    })

    it('Should narrow getTypedQuery against the declared validator return type', () => {
      const routes = {
        '/list': {
          component: () => makeComponent(),
          query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedQuery } = createNestedHooks(routes)
      expectTypeOf(getTypedQuery<'/list'>).returns.toEqualTypeOf<{ page: number } | null>()
    })

    it('Should reject paths not present in the route tree', () => {
      const routes = {
        '/tabs': {
          component: () => makeComponent(),
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const { getTypedHash } = createNestedHooks(routes)
      // @ts-expect-error -- '/nonexistent' is not a valid route path
      getTypedHash(createInjector(), '/nonexistent')
    })
  })
})
