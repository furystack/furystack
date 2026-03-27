import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { LocationService } from '../services/location-service.js'
import type { TypedNavigateArgs } from './nested-navigate.js'
import { createNestedNavigate, nestedNavigate } from './nested-navigate.js'
import type { NestedRoute } from './nested-router.js'

type TestRoute = Pick<NestedRoute<unknown>, 'component'>

describe('nestedNavigate', () => {
  it('Should navigate to a simple path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const locationService = injector.getInstance(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, '/buttons')

      expect(spy).toHaveBeenCalledWith('/buttons')
    })
  })

  it('Should compile params into the path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const locationService = injector.getInstance(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, '/users/:id', { id: '42' })

      expect(spy).toHaveBeenCalledWith('/users/42')
    })
  })

  it('Should compile multiple params into the path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const locationService = injector.getInstance(LocationService)
      const spy = vi.spyOn(locationService, 'navigate')

      nestedNavigate(injector, '/users/:userId/posts/:postId', { userId: '1', postId: '99' })

      expect(spy).toHaveBeenCalledWith('/users/1/posts/99')
    })
  })
})

describe('Type utilities', () => {
  describe('TypedNavigateArgs', () => {
    it('Should make params optional for paths without parameters', () => {
      type Args = TypedNavigateArgs<'/buttons'>
      expectTypeOf<Args>().toEqualTypeOf<[path: '/buttons', params?: Record<string, string>]>()
    })

    it('Should require params for parameterized paths', () => {
      type Args = TypedNavigateArgs<'/users/:id'>
      expectTypeOf<Args>().toEqualTypeOf<[path: '/users/:id', params: { id: string }]>()
    })

    it('Should require all params for multi-param paths', () => {
      type Args = TypedNavigateArgs<'/users/:userId/posts/:postId'>
      expectTypeOf<Args>().toEqualTypeOf<
        [path: '/users/:userId/posts/:postId', params: { userId: string; postId: string }]
      >()
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
      expectTypeOf(appNavigate<'/users/:userId'>).parameters.toEqualTypeOf<
        [injector: Injector, path: '/users/:userId', params: { userId: string }]
      >()
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
      expectTypeOf(appNavigate<'/buttons'>).parameters.toEqualTypeOf<
        [injector: Injector, path: '/buttons', params?: Record<string, string>]
      >()
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
      appNavigate(new Injector(), '/nonexistent')
    })

    it('Should accept routes with typed match parameters (NestedRoute<T>)', () => {
      const typedRoute: NestedRoute<{ stackName: string }> = {
        component: ({ match }) => match.params.stackName as unknown as JSX.Element,
      }

      const routes = {
        '/stacks/:stackName': typedRoute,
      }

      const appNavigate = createNestedNavigate<typeof routes>()
      expectTypeOf(appNavigate<'/stacks/:stackName'>).parameters.toEqualTypeOf<
        [injector: Injector, path: '/stacks/:stackName', params: { stackName: string }]
      >()
    })
  })
})
