import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineNestedRoutes } from './define-nested-routes.js'

const makeComponent = () => null as unknown as JSX.Element

describe('defineNestedRoutes', () => {
  it('Should return the same object reference at runtime', () => {
    const input = {
      '/tabs': {
        component: () => makeComponent(),
        hash: ['a', 'b'] as const,
      },
    }
    const result = defineNestedRoutes(input)
    expect(result).toBe(input)
  })

  it('Should accept values that satisfy Record<string, NestedRoute<...>>', () => {
    const routes = defineNestedRoutes({
      '/bare': { component: () => makeComponent() },
      '/tabs': {
        component: () => makeComponent(),
        hash: ['a', 'b'] as const,
        query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
      },
    })
    expect(Object.keys(routes)).toEqual(['/bare', '/tabs'])
  })

  describe('Type preservation', () => {
    it('Should preserve `hash` as a readonly tuple of literal values', () => {
      const routes = defineNestedRoutes({
        '/tabs': {
          component: () => makeComponent(),
          hash: ['overview', 'details'] as const,
        },
      })
      expectTypeOf(routes['/tabs'].hash).toEqualTypeOf<readonly ['overview', 'details']>()
    })

    it('Should preserve the declared return type of a `query` validator', () => {
      const routes = defineNestedRoutes({
        '/list': {
          component: () => makeComponent(),
          query: (raw): { page: number } | null => (typeof raw.page === 'number' ? { page: raw.page } : null),
        },
      })
      type QueryFn = NonNullable<(typeof routes)['/list']['query']>
      expectTypeOf<ReturnType<QueryFn>>().toEqualTypeOf<{ page: number } | null>()
    })

    it('Should preserve nested children literals', () => {
      const routes = defineNestedRoutes({
        '/navigation': {
          component: () => makeComponent(),
          children: {
            '/tabs': {
              component: () => makeComponent(),
              hash: ['a'] as const,
            },
          },
        },
      })
      type TabsHash = NonNullable<(typeof routes)['/navigation']['children']>['/tabs']['hash']
      expectTypeOf<TabsHash>().toEqualTypeOf<readonly ['a']>()
    })

    it('Should reject values that do not satisfy the NestedRoute constraint', () => {
      // @ts-expect-error -- `component` is required on every route entry
      defineNestedRoutes({ '/invalid': { hash: ['a'] as const } })
    })
  })

  describe('Satisfies-collapse regression coverage', () => {
    it('Should keep literal shape intact (unlike a bare `satisfies` assertion)', () => {
      // A plain `satisfies` on `Record<string, NestedRoute<any>>` would widen
      // the per-route `hash` to `readonly any[]` and drop the literal tuple.
      // `defineNestedRoutes` must preserve the narrow tuple so downstream
      // type extractors (`ExtractRouteHash`, `RouteAt`) can recover it.
      const routes = defineNestedRoutes({
        '/tabs': {
          component: () => makeComponent(),
          hash: ['overview'] as const,
        },
      })
      type Hash = (typeof routes)['/tabs']['hash']
      expectTypeOf<Hash>().not.toEqualTypeOf<readonly any[]>()
      expectTypeOf<Hash>().toEqualTypeOf<readonly ['overview']>()
    })
  })
})
