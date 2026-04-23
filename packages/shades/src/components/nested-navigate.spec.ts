import type { Injector } from '@furystack/inject'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { LocationService } from '../services/location-service.js'
import type { TypedNestedNavigateArgs } from './nested-navigate.js'
import { buildNestedNavigateUrl, createNestedNavigate, nestedNavigate } from './nested-navigate.js'
import type { NestedRoute } from './nested-router.js'

type TestRoute = Pick<NestedRoute<unknown, any, any>, 'component'>

describe('nestedNavigate', () => {
  it('Should navigate to a simple path', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, { path: '/buttons' })

      expect(spy).toHaveBeenCalledWith('/buttons')
    })
  })

  it('Should compile params into the path', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, { path: '/users/:id', params: { id: '42' } })

      expect(spy).toHaveBeenCalledWith('/users/42')
    })
  })

  it('Should compile multiple params into the path', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, {
        path: '/users/:userId/posts/:postId',
        params: { userId: '1', postId: '99' },
      })

      expect(spy).toHaveBeenCalledWith('/users/1/posts/99')
    })
  })

  it('Should append serialized query string when provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, { path: '/buttons', query: { page: 2 } })

      expect(spy).toHaveBeenCalledTimes(1)
      const navigatedUrl = spy.mock.calls[0][0]
      expect(navigatedUrl.startsWith('/buttons?')).toBe(true)
      const { deserializeQueryString } = locationService
      const search = navigatedUrl.slice(navigatedUrl.indexOf('?') + 1)
      expect(deserializeQueryString(search)).toEqual({ page: 2 })
    })
  })

  it('Should omit the query string when no keys are provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, { path: '/buttons', query: {} })

      expect(spy).toHaveBeenCalledWith('/buttons')
    })
  })

  it('Should append the hash segment when provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, { path: '/buttons', hash: 'overview' })

      expect(spy).toHaveBeenCalledWith('/buttons#overview')
    })
  })

  it('Should combine params, query and hash in the correct order', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, {
        path: '/users/:id',
        params: { id: '7' },
        query: { tab: 'profile' },
        hash: 'notes',
      })

      expect(spy).toHaveBeenCalledTimes(1)
      const navigatedUrl = spy.mock.calls[0][0]
      expect(navigatedUrl.startsWith('/users/7?')).toBe(true)
      expect(navigatedUrl.endsWith('#notes')).toBe(true)
    })
  })
})

describe('buildNestedNavigateUrl', () => {
  it('Should build a bare path URL', () => {
    expect(buildNestedNavigateUrl({ path: '/buttons' })).toBe('/buttons')
  })

  it('Should build a URL with compiled params', () => {
    expect(buildNestedNavigateUrl({ path: '/users/:id', params: { id: '42' } })).toBe('/users/42')
  })

  it('Should append a hash segment', () => {
    expect(buildNestedNavigateUrl({ path: '/buttons', hash: 'top' })).toBe('/buttons#top')
  })
})

describe('Type utilities', () => {
  describe('TypedNestedNavigateArgs', () => {
    it('Should make params optional for paths without parameters', () => {
      type Routes = { '/buttons': TestRoute }
      expectTypeOf<TypedNestedNavigateArgs<Routes, '/buttons'>>().toExtend<{ path: '/buttons' }>()
      expectTypeOf<TypedNestedNavigateArgs<Routes, '/buttons'>>().toExtend<{ params?: Record<string, string> }>()
    })

    it('Should require params for parameterized paths', () => {
      type Routes = { '/users/:id': TestRoute }
      expectTypeOf<TypedNestedNavigateArgs<Routes, '/users/:id'>>().toExtend<{ params: { id: string } }>()
    })

    it('Should require all params for multi-param paths', () => {
      type Routes = { '/users/:userId/posts/:postId': TestRoute }
      expectTypeOf<TypedNestedNavigateArgs<Routes, '/users/:userId/posts/:postId'>>().toExtend<{
        params: { userId: string; postId: string }
      }>()
    })
  })

  describe('createNestedNavigate', () => {
    it('Should constrain path to valid route paths', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/buttons': TestRoute
            '/inputs': TestRoute
          }
        }
      }

      const appNavigate = createNestedNavigate<Routes>()
      expectTypeOf(appNavigate<'/buttons'>)
        .parameter(0)
        .toEqualTypeOf<Injector>()
    })

    it('Should require params for parameterized routes in the tree', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/users/:userId': TestRoute
          }
        }
      }

      const appNavigate = createNestedNavigate<Routes>()
      expectTypeOf(appNavigate<'/users/:userId'>)
        .parameter(1)
        .toExtend<{ params: { userId: string } }>()
    })

    it('Should make params optional for non-parameterized routes', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/buttons': TestRoute
          }
        }
      }

      const appNavigate = createNestedNavigate<Routes>()
      expectTypeOf(appNavigate<'/buttons'>)
        .parameter(1)
        .toExtend<{ params?: Record<string, string> }>()
    })

    it('Should reject invalid paths', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/buttons': TestRoute
            '/inputs': TestRoute
          }
        }
      }

      const appNavigate = createNestedNavigate<Routes>()
      // @ts-expect-error -- '/nonexistent' is not a valid route path
      appNavigate(createInjector(), { path: '/nonexistent' })
    })

    it('Should accept routes with typed match parameters (NestedRoute<T>)', () => {
      const typedRoute: NestedRoute<{ stackName: string }> = {
        component: ({ match }) => match.params.stackName as unknown as JSX.Element,
      }

      const routes = {
        '/stacks/:stackName': typedRoute,
      }

      const appNavigate = createNestedNavigate<typeof routes>()
      expectTypeOf(appNavigate<'/stacks/:stackName'>)
        .parameter(1)
        .toExtend<{ params: { stackName: string } }>()
    })

    it('Should enforce a route-declared required query shape', () => {
      const routes = {
        '/list': {
          component: () => null as unknown as JSX.Element,
          query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const appNavigate = createNestedNavigate<typeof routes>()
      expectTypeOf(appNavigate<'/list'>)
        .parameter(1)
        .toExtend<{ query: { page: number } }>()
    })

    it('Should narrow hash to the declared literal tuple', () => {
      const routes = {
        '/tabs': {
          component: () => null as unknown as JSX.Element,
          hash: ['overview', 'details'] as const,
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const appNavigate = createNestedNavigate<typeof routes>()
      expectTypeOf(appNavigate<'/tabs'>)
        .parameter(1)
        .toExtend<{ hash?: 'overview' | 'details' }>()
    })
  })
})
