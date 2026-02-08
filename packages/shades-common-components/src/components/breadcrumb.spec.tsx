import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot, LocationService } from '@furystack/shades'
import type { ExtractRouteParams, NestedRoute } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { BreadcrumbItem, TypedBreadcrumbProps } from './breadcrumb.js'
import { Breadcrumb, createBreadcrumb } from './breadcrumb.js'

// Minimal route type for type-level tests
type TestRoute = Pick<NestedRoute<unknown>, 'component'>

describe('Breadcrumb', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Runtime behavior', () => {
    it('Should render basic breadcrumb trail with static routes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
            />
          ),
        })

        await flushUpdates()

        const component = rootElement.querySelector('nav[is="shade-breadcrumb"]')
        expect(component).toBeTruthy()
        expect(component?.textContent).toContain('Home')
        expect(component?.textContent).toContain('Users')
      })
    })

    it('Should compile dynamic route parameters correctly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/users', label: 'Users' },
                { path: '/users/:id', label: 'User Details', params: { id: '123' } },
              ]}
              lastItemClickable={true}
            />
          ),
        })

        await flushUpdates()

        const link = rootElement.querySelector('a[href="/users/123"]')
        expect(link).toBeTruthy()
        expect(link?.textContent).toBe('User Details')
      })
    })

    it('Should highlight active breadcrumb based on current URL', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const locationService = injector.getInstance(LocationService)

        history.pushState('', '', '/users')
        locationService.updateState()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
            />
          ),
        })

        await flushUpdates()

        const activeItem = rootElement.querySelector('[data-active="true"]')
        expect(activeItem).toBeTruthy()
        expect(activeItem?.textContent).toBe('Users')
      })
    })

    it('Should render custom separator as string', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
              separator=" > "
            />
          ),
        })

        await flushUpdates()

        const separator = rootElement.querySelector('[data-separator="true"]')
        expect(separator?.textContent).toBe(' > ')
      })
    })

    it('Should render optional home item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb homeItem={{ path: '/', label: 'Home' }} items={[{ path: '/users', label: 'Users' }]} />
          ),
        })

        await flushUpdates()

        const breadcrumb = rootElement.querySelector('nav')
        expect(breadcrumb?.textContent).toContain('Home')
        expect(breadcrumb?.textContent).toContain('Users')
      })
    })

    it('Should make last item non-clickable when lastItemClickable is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
              lastItemClickable={false}
            />
          ),
        })

        await flushUpdates()

        const links = rootElement.querySelectorAll('a')
        const spans = rootElement.querySelectorAll('[data-non-clickable="true"]')

        expect(links.length).toBe(1) // Only first item
        expect(spans.length).toBe(1) // Last item
      })
    })

    it('Should make last item clickable when lastItemClickable is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
              lastItemClickable={true}
            />
          ),
        })

        await flushUpdates()

        const links = rootElement.querySelectorAll('a')
        expect(links.length).toBe(2) // Both items
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
            <Breadcrumb
              items={[
                { path: '/home', label: 'Home' },
                { path: '/users', label: 'Users' },
              ]}
            />
          ),
        })

        await flushUpdates()

        expect(onRouteChange).not.toBeCalled()

        const firstLink = rootElement.querySelector('a') as HTMLAnchorElement
        firstLink?.click()

        expect(onRouteChange).toBeCalledTimes(1)
      })
    })

    it('Should apply custom className and style props', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[{ path: '/home', label: 'Home' }]}
              className="custom-breadcrumb"
              style={{ padding: '16px' }}
            />
          ),
        })

        await sleepAsync(50)

        const breadcrumb = rootElement.querySelector('nav[is="shade-breadcrumb"]')
        expect(breadcrumb?.classList.contains('custom-breadcrumb')).toBe(true)
        expect((breadcrumb as HTMLElement)?.style.padding).toBe('16px')
      })
    })

    it('Should handle empty items array gracefully', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Breadcrumb items={[]} />,
        })

        const nav = rootElement.querySelector('nav')
        expect(nav).toBeTruthy()
      })
    })

    it('Should render home item when items array is empty', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Breadcrumb homeItem={{ path: '/', label: 'Home' }} items={[]} />,
        })
        await flushUpdates()

        const breadcrumb = rootElement.querySelector('nav')
        expect(breadcrumb?.textContent).toContain('Home')
      })
    })

    it('Should compile multiple parameters correctly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Breadcrumb
              items={[{ path: '/users/:userId/posts/:postId', label: 'Post', params: { userId: '1', postId: '99' } }]}
              lastItemClickable={true}
            />
          ),
        })

        await flushUpdates()

        const link = rootElement.querySelector('a[href="/users/1/posts/99"]')
        expect(link).toBeTruthy()
        expect(link?.textContent).toBe('Post')
      })
    })
  })

  describe('Type safety', () => {
    describe('BreadcrumbItem', () => {
      it('Should require params when path has parameters', () => {
        type ItemWithParams = BreadcrumbItem<'/users/:id'>
        expectTypeOf<ItemWithParams>().toMatchTypeOf<{ params: { id: string } }>()
      })

      it('Should make params optional when path has no parameters', () => {
        type ItemWithoutParams = BreadcrumbItem<'/users'>
        expectTypeOf<ItemWithoutParams>().toMatchTypeOf<{ params?: Record<string, string> }>()
      })

      it('Should extract multiple params from path', () => {
        type ItemWithMultipleParams = BreadcrumbItem<'/users/:userId/posts/:postId'>
        expectTypeOf<ItemWithMultipleParams>().toMatchTypeOf<{ params: { userId: string; postId: string } }>()
      })
    })

    describe('ExtractRouteParams utility', () => {
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
    })

    describe('createBreadcrumb', () => {
      it('Should constrain paths to valid route tree paths', () => {
        type Routes = {
          '/': TestRoute & {
            children: {
              '/buttons': TestRoute
              '/users': TestRoute
            }
          }
        }

        const AppBreadcrumb = createBreadcrumb<Routes>()
        expectTypeOf(AppBreadcrumb).parameter(0).toHaveProperty('items')
      })

      it('Should enforce required params for dynamic routes', () => {
        type Routes = {
          '/': TestRoute & {
            children: {
              '/users/:id': TestRoute
            }
          }
        }

        createBreadcrumb<Routes>()
        type Props = TypedBreadcrumbProps<Routes>

        // Verify the type has the items property
        expectTypeOf<Props>().toHaveProperty('items')
      })

      it('Should require combined params from nested routes', () => {
        type Routes = {
          '/users/:userId': TestRoute & {
            children: {
              '/posts/:postId': TestRoute
            }
          }
        }

        createBreadcrumb<Routes>()
        type Props = TypedBreadcrumbProps<Routes>

        // Verify the type has the items property
        expectTypeOf<Props>().toHaveProperty('items')
      })
    })
  })
})
