import type { Injector } from '@furystack/inject'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { LocationService } from '../services/location-service.js'
import { createNestedReplace, nestedReplace } from './nested-replace.js'
import type { NestedRoute } from './nested-router.js'

type TestRoute = Pick<NestedRoute<unknown, any, any>, 'component'>

describe('nestedReplace', () => {
  it('Should replace the current history entry with a simple path', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const navigateSpy = vi.spyOn(locationService, 'navigate')
      const replaceSpy = vi.spyOn(locationService, 'replace')

      nestedReplace(injector, { path: '/buttons' })

      expect(replaceSpy).toHaveBeenCalledWith('/buttons')
      expect(navigateSpy).not.toHaveBeenCalled()
    })
  })

  it('Should compile params, query and hash for a replace call', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const locationService = injector.get(LocationService)
      const replaceSpy = vi.spyOn(locationService, 'replace')

      nestedReplace(injector, {
        path: '/users/:id',
        params: { id: '7' },
        query: { tab: 'profile' },
        hash: 'notes',
      })

      expect(replaceSpy).toHaveBeenCalledTimes(1)
      const replacedUrl = replaceSpy.mock.calls[0][0]
      expect(replacedUrl.startsWith('/users/7?')).toBe(true)
      expect(replacedUrl.endsWith('#notes')).toBe(true)
    })
  })
})

describe('createNestedReplace', () => {
  it('Should constrain path to valid route paths', () => {
    type Routes = {
      '/': TestRoute & {
        children: {
          '/buttons': TestRoute
          '/inputs': TestRoute
        }
      }
    }

    const appReplace = createNestedReplace<Routes>()
    expectTypeOf(appReplace<'/buttons'>)
      .parameter(0)
      .toEqualTypeOf<Injector>()
  })

  it('Should reject invalid paths', () => {
    type Routes = {
      '/': TestRoute & {
        children: {
          '/buttons': TestRoute
        }
      }
    }

    const appReplace = createNestedReplace<Routes>()
    // @ts-expect-error -- '/nonexistent' is not a valid route path
    appReplace(createInjector(), { path: '/nonexistent' })
  })

  it('Should enforce a declared required query shape', () => {
    const routes = {
      '/list': {
        component: () => null as unknown as JSX.Element,
        query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
      },
    } satisfies Record<string, NestedRoute<any, any, any>>

    const appReplace = createNestedReplace<typeof routes>()
    expectTypeOf(appReplace<'/list'>)
      .parameter(1)
      .toExtend<{ query: { page: number } }>()
  })
})
