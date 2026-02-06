import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import type { TypedNestedRouteLinkProps } from './nested-route-link.js'
import { NestedRouteLink, createNestedRouteLink } from './nested-route-link.js'
import type { ConcatPaths, ExtractRouteParams, ExtractRoutePaths, UrlTree } from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

// Minimal route type for type-level tests. Using Pick avoids the
// `children?: Record<string, NestedRoute<any>>` from NestedRoute<unknown>
// which would widen literal keys in intersections.
type TestRoute = Pick<NestedRoute<unknown>, 'component'>

describe('NestedRouteLink', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should render a link with the correct href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouteLink id="link" href="/buttons">
            Buttons
          </NestedRouteLink>
        ),
      })
      expect(document.body.innerHTML).toBe(
        '<div id="root"><a is="nested-route-link" id="link" href="/buttons">Buttons</a></div>',
      )
    })
  })

  it('Should trigger SPA navigation on click', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRouteChange = vi.fn()

      injector.getInstance(LocationService).onLocationPathChanged.subscribe(onRouteChange)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouteLink id="link" href="/buttons">
            Buttons
          </NestedRouteLink>
        ),
      })

      expect(onRouteChange).not.toBeCalled()
      document.getElementById('link')?.click()
      expect(onRouteChange).toBeCalledTimes(1)
    })
  })

  it('Should compile route params in the href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouteLink id="link" href="/users/:id" params={{ id: '42' }}>
            User 42
          </NestedRouteLink>
        ),
      })
      expect(document.body.innerHTML).toBe(
        '<div id="root"><a is="nested-route-link" id="link" href="/users/42">User 42</a></div>',
      )
    })
  })

  it('Should compile route params with multiple segments', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouteLink id="link" href="/users/:userId/posts/:postId" params={{ userId: '1', postId: '99' }}>
            Post
          </NestedRouteLink>
        ),
      })
      expect(document.body.innerHTML).toBe(
        '<div id="root"><a is="nested-route-link" id="link" href="/users/1/posts/99">Post</a></div>',
      )
    })
  })
})

describe('Type utilities', () => {
  describe('ConcatPaths', () => {
    it('Should strip root "/" when concatenating', () => {
      expectTypeOf<ConcatPaths<'/', '/buttons'>>().toEqualTypeOf<'/buttons'>()
    })

    it('Should concatenate non-root parent paths', () => {
      expectTypeOf<ConcatPaths<'/layout-tests', '/appbar-only'>>().toEqualTypeOf<'/layout-tests/appbar-only'>()
    })

    it('Should handle deeply nested paths', () => {
      expectTypeOf<ConcatPaths<'/a/b', '/c'>>().toEqualTypeOf<'/a/b/c'>()
    })
  })

  describe('ExtractRouteParams', () => {
    it('Should return Record<string, never> for paths without params', () => {
      expectTypeOf<ExtractRouteParams<'/buttons'>>().toEqualTypeOf<Record<string, never>>()
    })

    it('Should extract a single param', () => {
      expectTypeOf<ExtractRouteParams<'/users/:id'>>().toEqualTypeOf<{ id: string }>()
    })

    it('Should extract multiple params', () => {
      expectTypeOf<ExtractRouteParams<'/users/:userId/posts/:postId'>>().toEqualTypeOf<{
        userId: string
        postId: string
      }>()
    })

    it('Should handle params at the beginning of the path', () => {
      expectTypeOf<ExtractRouteParams<'/:id'>>().toEqualTypeOf<{ id: string }>()
    })
  })

  describe('ExtractRoutePaths', () => {
    it('Should extract top-level paths', () => {
      type Routes = {
        '/a': TestRoute
        '/b': TestRoute
      }
      expectTypeOf<ExtractRoutePaths<Routes>>().toEqualTypeOf<'/a' | '/b'>()
    })

    it('Should extract nested child paths with root parent', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/buttons': TestRoute
            '/inputs': TestRoute
          }
        }
      }
      expectTypeOf<ExtractRoutePaths<Routes>>().toEqualTypeOf<'/' | '/buttons' | '/inputs'>()
    })

    it('Should extract nested child paths with non-root parent', () => {
      type Routes = {
        '/layout-tests': TestRoute & {
          children: {
            '/appbar-only': TestRoute
            '/auto-hide': TestRoute
          }
        }
      }
      expectTypeOf<ExtractRoutePaths<Routes>>().toEqualTypeOf<
        '/layout-tests' | '/layout-tests/appbar-only' | '/layout-tests/auto-hide'
      >()
    })

    it('Should handle mixed flat and nested routes', () => {
      type Routes = {
        '/standalone': TestRoute
        '/parent': TestRoute & {
          children: {
            '/child': TestRoute
          }
        }
      }
      expectTypeOf<ExtractRoutePaths<Routes>>().toEqualTypeOf<'/standalone' | '/parent' | '/parent/child'>()
    })
  })

  describe('UrlTree', () => {
    it('Should accept a flat object of valid paths', () => {
      type Paths = '/a' | '/b'
      const urls = {
        a: '/a',
        b: '/b',
      } satisfies UrlTree<Paths>
      expectTypeOf(urls).toExtend<UrlTree<Paths>>()
    })

    it('Should accept nested objects of valid paths', () => {
      type Paths = '/' | '/buttons' | '/layout-tests' | '/layout-tests/appbar-only'
      const urls = {
        home: '/',
        buttons: '/buttons',
        layoutTests: {
          index: '/layout-tests',
          appBarOnly: '/layout-tests/appbar-only',
        },
      } satisfies UrlTree<Paths>
      expectTypeOf(urls).toExtend<UrlTree<Paths>>()
    })
  })

  describe('TypedNestedRouteLinkProps', () => {
    it('Should make params optional for paths without parameters', () => {
      type Props = TypedNestedRouteLinkProps<'/buttons'>
      expectTypeOf<Props['href']>().toEqualTypeOf<'/buttons'>()
      expectTypeOf<Props>().toExtend<{ params?: Record<string, string> }>()
    })

    it('Should require params for parameterized paths', () => {
      type Props = TypedNestedRouteLinkProps<'/users/:id'>
      expectTypeOf<Props['href']>().toEqualTypeOf<'/users/:id'>()
      expectTypeOf<Props>().toExtend<{ params: { id: string } }>()
    })

    it('Should require all params for multi-param paths', () => {
      type Props = TypedNestedRouteLinkProps<'/users/:userId/posts/:postId'>
      expectTypeOf<Props>().toExtend<{ params: { userId: string; postId: string } }>()
    })
  })

  describe('NestedRouteLink param inference', () => {
    it('Should infer params as optional when href has no parameters', () => {
      expectTypeOf(NestedRouteLink).parameter(0).toHaveProperty('params')
      expectTypeOf(NestedRouteLink<'/buttons'>)
        .parameter(0)
        .toExtend<{ params?: Record<string, string> }>()
    })

    it('Should infer params as required when href has a parameter', () => {
      expectTypeOf(NestedRouteLink<'/users/:id'>)
        .parameter(0)
        .toExtend<{ params: { id: string } }>()
    })

    it('Should infer multiple params from href', () => {
      expectTypeOf(NestedRouteLink<'/users/:userId/posts/:postId'>)
        .parameter(0)
        .toExtend<{ params: { userId: string; postId: string } }>()
    })
  })

  describe('createNestedRouteLink', () => {
    it('Should constrain href to valid route paths', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/buttons': TestRoute
          }
        }
      }

      const AppLink = createNestedRouteLink<Routes>()
      expectTypeOf(AppLink).parameter(0).toHaveProperty('href')
    })

    it('Should require params for parameterized routes in the tree', () => {
      type Routes = {
        '/': TestRoute & {
          children: {
            '/users/:userId': TestRoute
          }
        }
      }

      const AppLink = createNestedRouteLink<Routes>()
      expectTypeOf(AppLink<'/users/:userId'>)
        .parameter(0)
        .toExtend<{ params: { userId: string } }>()
    })

    it('Should require combined params from parent and child route segments', () => {
      type Routes = {
        '/users/:userId': TestRoute & {
          children: {
            '/posts/:postId': TestRoute
          }
        }
      }

      const AppLink = createNestedRouteLink<Routes>()
      expectTypeOf(AppLink<'/users/:userId/posts/:postId'>)
        .parameter(0)
        .toExtend<{ params: { userId: string; postId: string } }>()
    })
  })
})
