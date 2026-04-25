import { createInjector, Injector } from '@furystack/inject'
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { MatchChainEntry, NestedRoute } from '../components/nested-router.js'
import {
  buildDocumentTitle,
  extractNavTree,
  type NavTreeNode,
  resolveRouteTitle,
  resolveRouteTitles,
} from './route-meta-utils.js'

type TestRoute = Pick<NestedRoute<unknown, any, any>, 'component'>

describe('resolveRouteTitle', () => {
  const injector = createInjector()

  it('should return undefined when no meta is configured', async () => {
    const entry: MatchChainEntry = {
      route: { component: () => ({}) as JSX.Element },
      match: { path: '/about', params: {} },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBeUndefined()
  })

  it('should return undefined when meta has no title', async () => {
    const entry: MatchChainEntry = {
      route: { meta: {}, component: () => ({}) as JSX.Element },
      match: { path: '/about', params: {} },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBeUndefined()
  })

  it('should return a static string title', async () => {
    const entry: MatchChainEntry = {
      route: { meta: { title: 'About' }, component: () => ({}) as JSX.Element },
      match: { path: '/about', params: {} },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBe('About')
  })

  it('should resolve a synchronous function title', async () => {
    const entry: MatchChainEntry = {
      route: {
        meta: { title: ({ match }) => `User ${(match.params as { id: string }).id}` },
        component: () => ({}) as JSX.Element,
      },
      match: { path: '/users/42', params: { id: '42' } },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBe('User 42')
  })

  it('should resolve an async function title', async () => {
    const entry: MatchChainEntry = {
      route: {
        meta: {
          title: async ({ match }) => {
            const { id } = match.params as { id: string }
            return `Movie ${id}`
          },
        },
        component: () => ({}) as JSX.Element,
      },
      match: { path: '/movies/7', params: { id: '7' } },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBe('Movie 7')
  })

  it('should pass the injector to the title resolver', async () => {
    const entry: MatchChainEntry = {
      route: {
        meta: {
          title: ({ injector: inj }) => (inj instanceof Injector ? 'has-injector' : 'no-injector'),
        },
        component: () => ({}) as JSX.Element,
      },
      match: { path: '/test', params: {} },
      query: null,
      hash: undefined,
    }
    expect(await resolveRouteTitle(entry, injector)).toBe('has-injector')
  })
})

describe('resolveRouteTitles', () => {
  const injector = createInjector()

  it('should resolve all titles in a mixed chain', async () => {
    const chain: MatchChainEntry[] = [
      {
        route: { meta: { title: 'Media' }, component: () => ({}) as JSX.Element },
        match: { path: '/media', params: {} },
        query: null,
        hash: undefined,
      },
      {
        route: { meta: { title: 'Movies' }, component: () => ({}) as JSX.Element },
        match: { path: '/movies', params: {} },
        query: null,
        hash: undefined,
      },
      {
        route: {
          meta: { title: async ({ match }) => `Movie ${(match.params as { id: string }).id}` },
          component: () => ({}) as JSX.Element,
        },
        match: { path: '/7', params: { id: '7' } },
        query: null,
        hash: undefined,
      },
    ]
    const titles = await resolveRouteTitles(chain, injector)
    expect(titles).toEqual(['Media', 'Movies', 'Movie 7'])
  })

  it('should return an empty array for an empty chain', async () => {
    const titles = await resolveRouteTitles([], injector)
    expect(titles).toEqual([])
  })

  it('should include undefined for entries without titles', async () => {
    const chain: MatchChainEntry[] = [
      {
        route: { meta: { title: 'Root' }, component: () => ({}) as JSX.Element },
        match: { path: '/', params: {} },
        query: null,
        hash: undefined,
      },
      {
        route: { component: () => ({}) as JSX.Element },
        match: { path: '/child', params: {} },
        query: null,
        hash: undefined,
      },
    ]
    const titles = await resolveRouteTitles(chain, injector)
    expect(titles).toEqual(['Root', undefined])
  })
})

describe('buildDocumentTitle', () => {
  it('should join titles with default separator', () => {
    expect(buildDocumentTitle(['Media', 'Movies'])).toBe('Media - Movies')
  })

  it('should filter out undefined entries', () => {
    expect(buildDocumentTitle(['Media', undefined, 'Movies'])).toBe('Media - Movies')
  })

  it('should use a custom separator', () => {
    expect(buildDocumentTitle(['Media', 'Movies', 'Superman'], { separator: ' / ' })).toBe('Media / Movies / Superman')
  })

  it('should prepend a prefix', () => {
    expect(buildDocumentTitle(['Media', 'Movies'], { prefix: 'My App' })).toBe('My App - Media - Movies')
  })

  it('should combine prefix and custom separator', () => {
    expect(buildDocumentTitle(['Media', 'Movies', 'Superman'], { prefix: 'My App', separator: ' / ' })).toBe(
      'My App / Media / Movies / Superman',
    )
  })

  it('should return empty string for empty titles', () => {
    expect(buildDocumentTitle([])).toBe('')
  })

  it('should return only prefix when all titles are undefined', () => {
    expect(buildDocumentTitle([undefined, undefined], { prefix: 'My App' })).toBe('My App')
  })

  it('should return prefix alone when titles is empty', () => {
    expect(buildDocumentTitle([], { prefix: 'My App' })).toBe('My App')
  })
})

describe('extractNavTree', () => {
  it('should extract a flat route tree', () => {
    const routes: Record<string, NestedRoute<any, any, any>> = {
      '/about': { meta: { title: 'About' }, component: () => ({}) as JSX.Element },
      '/contact': { meta: { title: 'Contact' }, component: () => ({}) as JSX.Element },
    }
    const tree = extractNavTree(routes)
    expect(tree).toEqual([
      { pattern: '/about', fullPath: '/about', meta: { title: 'About' }, children: undefined },
      { pattern: '/contact', fullPath: '/contact', meta: { title: 'Contact' }, children: undefined },
    ])
  })

  it('should extract nested routes recursively', () => {
    const routes: Record<string, NestedRoute<any, any, any>> = {
      '/media': {
        meta: { title: 'Media' },
        component: () => ({}) as JSX.Element,
        children: {
          '/movies': { meta: { title: 'Movies' }, component: () => ({}) as JSX.Element },
          '/music': { meta: { title: 'Music' }, component: () => ({}) as JSX.Element },
        },
      },
    }
    const tree = extractNavTree(routes)
    expect(tree).toHaveLength(1)
    expect(tree[0].pattern).toBe('/media')
    expect(tree[0].fullPath).toBe('/media')
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children![0]).toEqual({
      pattern: '/movies',
      fullPath: '/media/movies',
      meta: { title: 'Movies' },
      children: undefined,
    })
    expect(tree[0].children![1]).toEqual({
      pattern: '/music',
      fullPath: '/media/music',
      meta: { title: 'Music' },
      children: undefined,
    })
  })

  it('should handle root "/" parent path correctly', () => {
    const routes: Record<string, NestedRoute<any, any, any>> = {
      '/': {
        meta: { title: 'Home' },
        component: () => ({}) as JSX.Element,
        children: {
          '/settings': { meta: { title: 'Settings' }, component: () => ({}) as JSX.Element },
        },
      },
    }
    const tree = extractNavTree(routes)
    expect(tree[0].fullPath).toBe('/')
    expect(tree[0].children![0].fullPath).toBe('/settings')
  })

  it('should compute correct fullPath for deeply nested routes (3+ levels)', () => {
    const routes: Record<string, NestedRoute<any, any, any>> = {
      '/a': {
        meta: { title: 'A' },
        component: () => ({}) as JSX.Element,
        children: {
          '/b': {
            meta: { title: 'B' },
            component: () => ({}) as JSX.Element,
            children: {
              '/c': { meta: { title: 'C' }, component: () => ({}) as JSX.Element },
            },
          },
        },
      },
    }
    const tree = extractNavTree(routes)
    expect(tree[0].fullPath).toBe('/a')
    expect(tree[0].children![0].fullPath).toBe('/a/b')
    expect(tree[0].children![0].children![0].fullPath).toBe('/a/b/c')
  })

  it('should include routes without meta', () => {
    const routes: Record<string, NestedRoute<any, any, any>> = {
      '/hidden': { component: () => ({}) as JSX.Element },
    }
    const tree = extractNavTree(routes)
    expect(tree[0].meta).toBeUndefined()
  })

  describe('typed output', () => {
    it('should narrow pattern and fullPath for a flat typed tree', () => {
      const routes = {
        '/about': { component: () => ({}) as JSX.Element } satisfies TestRoute,
        '/contact': { component: () => ({}) as JSX.Element } satisfies TestRoute,
      } satisfies Record<string, NestedRoute<any, any, any>>

      const tree = extractNavTree(routes)
      expectTypeOf(tree[0].pattern).toEqualTypeOf<'/about' | '/contact'>()
      expectTypeOf(tree[0].fullPath).toEqualTypeOf<'/about' | '/contact'>()
    })

    it('should include nested composed paths in the fullPath union', () => {
      const routes = {
        '/media': {
          component: () => ({}) as JSX.Element,
          children: {
            '/movies': { component: () => ({}) as JSX.Element } satisfies TestRoute,
            '/music': { component: () => ({}) as JSX.Element } satisfies TestRoute,
          },
        },
      } satisfies Record<string, NestedRoute<any, any, any>>

      const tree = extractNavTree(routes)
      expectTypeOf(tree[0].fullPath).toEqualTypeOf<'/media' | '/media/movies' | '/media/music'>()
      expectTypeOf(tree[0].children).toEqualTypeOf<Array<NavTreeNode<typeof routes>> | undefined>()
    })

    it('should preserve backward compatibility with the widened default', () => {
      const node: NavTreeNode = {
        pattern: '/anything',
        fullPath: '/anything',
      }
      expectTypeOf(node.pattern).toEqualTypeOf<string>()
      expectTypeOf(node.fullPath).toEqualTypeOf<string>()
    })
  })
})
