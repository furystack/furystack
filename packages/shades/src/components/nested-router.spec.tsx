import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import { flushUpdates } from '../shade.js'
import { RouteMatchService } from '../services/route-match-service.js'
import {
  buildMatchChain,
  findDivergenceIndex,
  NestedRouter,
  renderMatchChain,
  resolveViewTransition,
  type MatchChainEntry,
  type NestedRoute,
} from './nested-router.js'
import { NestedRouteLink } from './nested-route-link.js'

describe('buildMatchChain', () => {
  it('should match a simple leaf route', () => {
    const route: NestedRoute = { component: () => <div /> }
    const chain = buildMatchChain({ '/about': route }, '/about')
    expect(chain).toHaveLength(1)
    expect(chain![0].route).toBe(route)
  })

  it('should return null when no route matches', () => {
    const route: NestedRoute = { component: () => <div /> }
    const chain = buildMatchChain({ '/about': route }, '/missing')
    expect(chain).toBeNull()
  })

  it('should match a parent with a child route', () => {
    const child: NestedRoute = { component: () => <div>child</div> }
    const parent: NestedRoute = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/sub': child },
    }
    const chain = buildMatchChain({ '/parent': parent }, '/parent/sub')
    expect(chain).toHaveLength(2)
    expect(chain![0].route).toBe(parent)
    expect(chain![1].route).toBe(child)
  })

  it('should match parent alone when no child matches', () => {
    const child: NestedRoute = { component: () => <div>child</div> }
    const parent: NestedRoute = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/sub': child },
    }
    const chain = buildMatchChain({ '/parent': parent }, '/parent')
    expect(chain).toHaveLength(1)
    expect(chain![0].route).toBe(parent)
  })

  it('should extract route parameters from the URL', () => {
    const route: NestedRoute<{ id: string }> = { component: () => <div /> }
    const chain = buildMatchChain({ '/users/:id': route }, '/users/42')
    expect(chain).toHaveLength(1)
    expect(chain![0].match.params).toEqual({ id: '42' })
  })

  it('should match deep nesting (3 levels)', () => {
    const grandchild: NestedRoute = { component: () => <div>grandchild</div> }
    const child: NestedRoute = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/gc': grandchild },
    }
    const parent: NestedRoute = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/child': child },
    }
    const chain = buildMatchChain({ '/root': parent }, '/root/child/gc')
    expect(chain).toHaveLength(3)
    expect(chain![0].route).toBe(parent)
    expect(chain![1].route).toBe(child)
    expect(chain![2].route).toBe(grandchild)
  })

  it('should return the first matching route in definition order', () => {
    const specific: NestedRoute = { component: () => <div>specific</div> }
    const catchAll: NestedRoute = { component: () => <div>catch-all</div> }
    const chain = buildMatchChain({ '/:slug': specific, '/': catchAll }, '/hello')
    expect(chain).toHaveLength(1)
    expect(chain![0].route).toBe(specific)
    expect(chain![0].match.params).toEqual({ slug: 'hello' })
  })

  it('should match root "/" parent with children against child URLs (path-to-regexp v8 workaround)', () => {
    const child: NestedRoute = { component: () => <div>buttons</div> }
    const parent: NestedRoute = {
      component: ({ outlet }) => <div>layout{outlet}</div>,
      children: { '/buttons': child },
    }
    const chain = buildMatchChain({ '/': parent }, '/buttons')
    expect(chain).toHaveLength(2)
    expect(chain![0].route).toBe(parent)
    expect(chain![1].route).toBe(child)
  })

  it('should match root "/" parent alone when URL is exactly "/"', () => {
    const child: NestedRoute = { component: () => <div>buttons</div> }
    const parent: NestedRoute = {
      component: ({ outlet }) => <div>layout{outlet}</div>,
      children: { '/buttons': child },
    }
    const chain = buildMatchChain({ '/': parent }, '/')
    expect(chain).toHaveLength(1)
    expect(chain![0].route).toBe(parent)
  })

  it('should prefer a more specific route over the root "/" parent', () => {
    const specificChild: NestedRoute = { component: () => <div>specific</div> }
    const rootChild: NestedRoute = { component: () => <div>root-child</div> }
    const rootParent: NestedRoute = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/other': rootChild },
    }
    const chain = buildMatchChain({ '/specific': specificChild, '/': rootParent }, '/specific')
    expect(chain).toHaveLength(1)
    expect(chain![0].route).toBe(specificChild)
  })

  it('should extract parameters from both parent and child', () => {
    const child: NestedRoute<{ postId: string }> = { component: () => <div /> }
    const parent: NestedRoute<{ userId: string }> = {
      component: ({ outlet }) => <div>{outlet}</div>,
      children: { '/posts/:postId': child },
    }
    const chain = buildMatchChain({ '/users/:userId': parent }, '/users/5/posts/10')
    expect(chain).toHaveLength(2)
    expect(chain![0].match.params).toEqual({ userId: '5' })
    expect(chain![1].match.params).toEqual({ postId: '10' })
  })
})

describe('findDivergenceIndex', () => {
  const makeEntry = (id: number, params: Record<string, string> = {}): MatchChainEntry => ({
    route: { component: () => <div>{id}</div> },
    match: { path: '/', params },
    query: null,
    hash: undefined,
  })

  it('should return 0 for completely different chains', () => {
    const oldChain = [makeEntry(1)]
    const newChain = [makeEntry(2)]
    expect(findDivergenceIndex(oldChain, newChain)).toBe(0)
  })

  it('should return minLength when one chain is a prefix of the other', () => {
    const entry = makeEntry(1)
    const oldChain = [entry]
    const newChain = [entry, makeEntry(2)]
    expect(findDivergenceIndex(oldChain, newChain)).toBe(1)
  })

  it('should return the length when chains are identical', () => {
    const entry1 = makeEntry(1)
    const entry2 = makeEntry(2)
    const chain = [entry1, entry2]
    expect(findDivergenceIndex(chain, chain)).toBe(2)
  })

  it('should detect divergence from changed params', () => {
    const route: NestedRoute = { component: () => <div /> }
    const oldChain: MatchChainEntry[] = [
      { route, match: { path: '/', params: { id: '1' } }, query: null, hash: undefined },
    ]
    const newChain: MatchChainEntry[] = [
      { route, match: { path: '/', params: { id: '2' } }, query: null, hash: undefined },
    ]
    expect(findDivergenceIndex(oldChain, newChain)).toBe(0)
  })
})

describe('renderMatchChain', () => {
  it('should render a single leaf route with outlet undefined', () => {
    const componentFn = vi.fn(({ outlet }: { outlet?: JSX.Element }) => (
      <div>leaf{outlet ? 'has-outlet' : 'no-outlet'}</div>
    ))
    const chain: MatchChainEntry[] = [
      {
        route: { component: componentFn },
        match: { path: '/leaf', params: {} },
        query: null,
        hash: undefined,
      },
    ]

    const result = renderMatchChain(chain, '/leaf')

    expect(componentFn).toHaveBeenCalledTimes(1)
    expect(componentFn).toHaveBeenCalledWith({
      currentUrl: '/leaf',
      match: { path: '/leaf', params: {} },
      query: null,
      hash: undefined,
      outlet: undefined,
    })
    expect(result.chainElements).toHaveLength(1)
    expect(result.jsx).toBe(result.chainElements[0])
  })

  it('should render inside-out: innermost first, then pass as outlet to parent', () => {
    const callOrder: string[] = []

    const childComponent = vi.fn(({ outlet }: { outlet?: JSX.Element }) => {
      callOrder.push('child')
      return <span>child{outlet}</span>
    })
    const parentComponent = vi.fn(({ outlet }: { outlet?: JSX.Element }) => {
      callOrder.push('parent')
      return <div>parent{outlet}</div>
    })

    const chain: MatchChainEntry[] = [
      {
        route: { component: parentComponent },
        match: { path: '/parent', params: {} },
        query: null,
        hash: undefined,
      },
      {
        route: { component: childComponent },
        match: { path: '/child', params: {} },
        query: null,
        hash: undefined,
      },
    ]

    const result = renderMatchChain(chain, '/parent/child')

    expect(callOrder).toEqual(['child', 'parent'])
    expect(childComponent).toHaveBeenCalledWith(expect.objectContaining({ outlet: undefined }))
    expect(parentComponent).toHaveBeenCalledWith(expect.objectContaining({ outlet: expect.anything() as unknown }))

    expect(result.chainElements).toHaveLength(2)
    expect(result.jsx).toBe(result.chainElements[0])
    expect(result.chainElements[0]).not.toBe(result.chainElements[1])
  })

  it('should pass currentUrl to every component in the chain', () => {
    const urls: string[] = []

    const makeComponent = () =>
      vi.fn(({ currentUrl }: { currentUrl: string; outlet?: JSX.Element }) => {
        urls.push(currentUrl)
        return <div />
      })

    const grandchild = makeComponent()
    const child = makeComponent()
    const parent = makeComponent()

    const chain: MatchChainEntry[] = [
      { route: { component: parent }, match: { path: '/a', params: {} }, query: null, hash: undefined },
      { route: { component: child }, match: { path: '/b', params: {} }, query: null, hash: undefined },
      { route: { component: grandchild }, match: { path: '/c', params: {} }, query: null, hash: undefined },
    ]

    renderMatchChain(chain, '/a/b/c')

    expect(urls).toEqual(['/a/b/c', '/a/b/c', '/a/b/c'])
  })

  it('should return per-entry chainElements where each entry is the component output at that level', () => {
    const grandchildEl = <div>grandchild</div>
    const childComponent = vi.fn(({ outlet }: { outlet?: JSX.Element }) => <section>child{outlet}</section>)
    const parentComponent = vi.fn(({ outlet }: { outlet?: JSX.Element }) => <main>parent{outlet}</main>)

    const chain: MatchChainEntry[] = [
      { route: { component: parentComponent }, match: { path: '/a', params: {} }, query: null, hash: undefined },
      { route: { component: childComponent }, match: { path: '/b', params: {} }, query: null, hash: undefined },
      { route: { component: () => grandchildEl }, match: { path: '/c', params: {} }, query: null, hash: undefined },
    ]

    const result = renderMatchChain(chain, '/a/b/c')

    expect(result.chainElements).toHaveLength(3)
    // chainElements[2] is the leaf (grandchild output)
    expect(result.chainElements[2]).toBe(grandchildEl)
    // chainElements[1] is the child wrapping the grandchild
    expect(result.chainElements[1]).not.toBe(grandchildEl)
    // chainElements[0] is the outermost parent (same as jsx)
    expect(result.chainElements[0]).toBe(result.jsx)
    // Each level wraps the next, so they must all be different
    expect(result.chainElements[0]).not.toBe(result.chainElements[1])
    expect(result.chainElements[1]).not.toBe(result.chainElements[2])
  })
})

describe('NestedRouter lifecycle hooks', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should correctly fire onVisit/onLeave across nested child switches and notFound transitions', async () => {
    history.pushState(null, '', '/parent/child-a')

    const callOrder: string[] = []

    const onVisitParent = vi.fn(async () => {
      callOrder.push('visit-parent')
    })
    const onLeaveParent = vi.fn(async () => {
      callOrder.push('leave-parent')
    })
    const onVisitChildA = vi.fn(async () => {
      callOrder.push('visit-child-a')
    })
    const onLeaveChildA = vi.fn(async () => {
      callOrder.push('leave-child-a')
    })
    const onVisitChildB = vi.fn(async () => {
      callOrder.push('visit-child-b')
    })
    const onLeaveChildB = vi.fn(async () => {
      callOrder.push('leave-child-b')
    })
    const onVisitOther = vi.fn(async () => {
      callOrder.push('visit-other')
    })
    const onLeaveOther = vi.fn(async () => {
      callOrder.push('leave-other')
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="child-a" path="/parent/child-a">
              child-a
            </NestedRouteLink>
            <NestedRouteLink id="child-b" path="/parent/child-b">
              child-b
            </NestedRouteLink>
            <NestedRouteLink id="other" path="/other">
              other
            </NestedRouteLink>
            <NestedRouteLink id="nowhere" path="/nowhere">
              nowhere
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/parent': {
                  component: ({ outlet }) => <div id="wrapper">{outlet ?? <div id="content">parent-index</div>}</div>,
                  onVisit: onVisitParent,
                  onLeave: onLeaveParent,
                  children: {
                    '/child-a': {
                      component: () => <div id="content">child-a</div>,
                      onVisit: onVisitChildA,
                      onLeave: onLeaveChildA,
                    },
                    '/child-b': {
                      component: () => <div id="content">child-b</div>,
                      onVisit: onVisitChildB,
                      onLeave: onLeaveChildB,
                    },
                  },
                },
                '/other': {
                  component: () => <div id="content">other</div>,
                  onVisit: onVisitOther,
                  onLeave: onLeaveOther,
                },
              }}
              notFound={<div id="content">not found</div>}
            />
          </div>
        ),
      })

      const getContent = () => document.getElementById('content')?.innerHTML
      const clickOn = (name: string) => document.getElementById(name)?.click()

      // --- Initial load at /parent/child-a ---
      await flushUpdates()
      expect(getContent()).toBe('child-a')
      expect(onVisitParent).toBeCalledTimes(1)
      expect(onVisitChildA).toBeCalledTimes(1)
      expect(callOrder).toEqual(['visit-parent', 'visit-child-a'])

      // --- Click same route: no lifecycle hooks should fire ---
      callOrder.length = 0
      clickOn('child-a')
      await flushUpdates()
      expect(onVisitParent).toBeCalledTimes(1)
      expect(onVisitChildA).toBeCalledTimes(1)
      expect(callOrder).toEqual([])

      // --- Switch child: only child lifecycle fires, parent stays ---
      callOrder.length = 0
      clickOn('child-b')
      await flushUpdates()
      expect(getContent()).toBe('child-b')
      expect(onLeaveChildA).toBeCalledTimes(1)
      expect(onVisitChildB).toBeCalledTimes(1)
      expect(onLeaveParent).not.toBeCalled()
      expect(onVisitParent).toBeCalledTimes(1)
      expect(callOrder).toEqual(['leave-child-a', 'visit-child-b'])

      // --- Navigate to a completely different branch ---
      callOrder.length = 0
      clickOn('other')
      await flushUpdates()
      await flushUpdates()
      expect(getContent()).toBe('other')
      expect(onLeaveChildB).toBeCalledTimes(1)
      expect(onLeaveParent).toBeCalledTimes(1)
      expect(onVisitOther).toBeCalledTimes(1)
      // onLeave fires innermost-first, then onVisit for the new branch
      expect(callOrder).toEqual(['leave-child-b', 'leave-parent', 'visit-other'])

      // --- Navigate to non-matching URL: onLeave for all active ---
      callOrder.length = 0
      clickOn('nowhere')
      await flushUpdates()
      expect(getContent()).toBe('not found')
      expect(onLeaveOther).toBeCalledTimes(1)
      expect(callOrder).toEqual(['leave-other'])
    })
  })
})

describe('NestedRouter latest-wins on rapid navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should skip intermediate route when navigating rapidly (latest wins)', async () => {
    history.pushState(null, '', '/route-a')

    const callOrder: string[] = []

    const onVisitA = vi.fn(async () => {
      callOrder.push('visit-a')
    })
    const onLeaveA = vi.fn(async () => {
      callOrder.push('leave-a')
    })
    const onVisitB = vi.fn(async () => {
      await sleepAsync(200)
      callOrder.push('visit-b')
    })
    const onLeaveB = vi.fn(async () => {
      callOrder.push('leave-b')
    })
    const onVisitC = vi.fn(async () => {
      callOrder.push('visit-c')
    })
    const onLeaveC = vi.fn(async () => {
      callOrder.push('leave-c')
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-a" path="/route-a">
              a
            </NestedRouteLink>
            <NestedRouteLink id="go-b" path="/route-b">
              b
            </NestedRouteLink>
            <NestedRouteLink id="go-c" path="/route-c">
              c
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/route-a': {
                  component: () => <div id="content">route-a</div>,
                  onVisit: onVisitA,
                  onLeave: onLeaveA,
                },
                '/route-b': {
                  component: () => <div id="content">route-b</div>,
                  onVisit: onVisitB,
                  onLeave: onLeaveB,
                },
                '/route-c': {
                  component: () => <div id="content">route-c</div>,
                  onVisit: onVisitC,
                  onLeave: onLeaveC,
                },
              }}
            />
          </div>
        ),
      })

      const getContent = () => document.getElementById('content')?.innerHTML
      const clickOn = (name: string) => document.getElementById(name)?.click()

      // --- Initial load at /route-a ---
      await flushUpdates()
      expect(getContent()).toBe('route-a')
      expect(onVisitA).toHaveBeenCalledTimes(1)

      // --- Rapid navigation: click B then immediately C ---
      callOrder.length = 0
      clickOn('go-b')
      // Don't await — immediately navigate again
      clickOn('go-c')

      // Wait long enough for both transitions to settle (onVisitB has 200ms delay)
      await sleepAsync(500)

      // The final destination should be route-c
      expect(getContent()).toBe('route-c')
      expect(onVisitC).toHaveBeenCalledTimes(1)

      // route-b's onVisit should have been abandoned (never completed or never started)
      // because the version token was superseded by the /route-c navigation
      expect(callOrder).not.toContain('visit-b')
    })
  })
})

describe('NestedRouter lifecycle element scope', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should pass the child element (not the full tree) to onLeave/onVisit when switching between sibling children', async () => {
    history.pushState(null, '', '/parent/child-a')

    const visitElements: Array<{ route: string; element: JSX.Element }> = []
    const leaveElements: Array<{ route: string; element: JSX.Element }> = []

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="child-a" path="/parent/child-a">
              child-a
            </NestedRouteLink>
            <NestedRouteLink id="child-b" path="/parent/child-b">
              child-b
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/parent': {
                  component: ({ outlet }) => <div id="wrapper">{outlet ?? <span>index</span>}</div>,
                  onVisit: async ({ element }) => {
                    visitElements.push({ route: 'parent', element })
                  },
                  onLeave: async ({ element }) => {
                    leaveElements.push({ route: 'parent', element })
                  },
                  children: {
                    '/child-a': {
                      component: () => <div id="child-a-content">child-a</div>,
                      onVisit: async ({ element }) => {
                        visitElements.push({ route: 'child-a', element })
                      },
                      onLeave: async ({ element }) => {
                        leaveElements.push({ route: 'child-a', element })
                      },
                    },
                    '/child-b': {
                      component: () => <div id="child-b-content">child-b</div>,
                      onVisit: async ({ element }) => {
                        visitElements.push({ route: 'child-b', element })
                      },
                      onLeave: async ({ element }) => {
                        leaveElements.push({ route: 'child-b', element })
                      },
                    },
                  },
                },
              }}
            />
          </div>
        ),
      })

      const clickOn = (name: string) => document.getElementById(name)?.click()

      // --- Initial load at /parent/child-a ---
      await flushUpdates()
      expect(visitElements).toHaveLength(2)
      // Parent's onVisit element should be the full tree (parent wrapping child)
      expect(visitElements[0].route).toBe('parent')
      expect((visitElements[0].element as HTMLElement).getAttribute('id')).toBe('wrapper')
      // Child-a's onVisit element should be just the child element, not the wrapper
      expect(visitElements[1].route).toBe('child-a')
      expect((visitElements[1].element as HTMLElement).getAttribute('id')).toBe('child-a-content')

      // --- Switch to child-b: parent stays, only child lifecycle fires ---
      visitElements.length = 0
      leaveElements.length = 0
      clickOn('child-b')
      await flushUpdates()

      // onLeave should receive the child-a element, not the full wrapper
      expect(leaveElements).toHaveLength(1)
      expect(leaveElements[0].route).toBe('child-a')
      expect((leaveElements[0].element as HTMLElement).getAttribute('id')).toBe('child-a-content')

      // onVisit should receive the child-b element, not the full wrapper
      expect(visitElements).toHaveLength(1)
      expect(visitElements[0].route).toBe('child-b')
      expect((visitElements[0].element as HTMLElement).getAttribute('id')).toBe('child-b-content')
    })
  })
})

describe('NestedRouter flat routes', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render and navigate between flat (non-nested) Record routes', async () => {
    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="home" path="/">
              home
            </NestedRouteLink>
            <NestedRouteLink id="about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouteLink id="contact" path="/contact">
              contact
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/about': { component: () => <div id="content">about-page</div> },
                '/contact': { component: () => <div id="content">contact-page</div> },
                '/': { component: () => <div id="content">home-page</div> },
              }}
              notFound={<div id="content">not found</div>}
            />
          </div>
        ),
      })

      const getContent = () => document.getElementById('content')?.innerHTML
      const clickOn = (name: string) => document.getElementById(name)?.click()

      await flushUpdates()
      expect(getContent()).toBe('home-page')

      clickOn('about')
      await flushUpdates()
      expect(getContent()).toBe('about-page')

      clickOn('contact')
      await flushUpdates()
      expect(getContent()).toBe('contact-page')

      clickOn('home')
      await flushUpdates()
      expect(getContent()).toBe('home-page')
    })
  })
})

describe('NestedRouter outlet composition', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should compose parent layout wrapping child content via outlet', async () => {
    history.pushState(null, '', '/dashboard/settings')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouter
            routes={{
              '/dashboard': {
                component: ({ outlet }) => (
                  <div id="layout">
                    <header id="header">Dashboard Header</header>
                    <main id="main">{outlet ?? <div id="child">index</div>}</main>
                  </div>
                ),
                children: {
                  '/settings': {
                    component: () => <div id="child">settings-content</div>,
                  },
                  '/profile': {
                    component: () => <div id="child">profile-content</div>,
                  },
                },
              },
            }}
          />
        ),
      })

      await flushUpdates()

      // Parent layout should be rendered with child inside
      expect(document.getElementById('header')?.innerHTML).toBe('Dashboard Header')
      expect(document.getElementById('child')?.innerHTML).toBe('settings-content')
      // Child is inside #main which is inside #layout
      const layout = document.getElementById('layout')
      expect(layout).toBeTruthy()
      expect(layout!.querySelector('#main #child')).toBeTruthy()
    })
  })

  it('should render parent with fallback when navigating to parent URL without a child match', async () => {
    history.pushState(null, '', '/dashboard')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouter
            routes={{
              '/dashboard': {
                component: ({ outlet }) => (
                  <div id="layout">
                    <main id="main">{outlet ?? <div id="child">dashboard-index</div>}</main>
                  </div>
                ),
                children: {
                  '/settings': {
                    component: () => <div id="child">settings</div>,
                  },
                },
              },
            }}
          />
        ),
      })

      await flushUpdates()

      // Parent matched alone, outlet is undefined, so the fallback renders
      expect(document.getElementById('child')?.innerHTML).toBe('dashboard-index')
    })
  })
})

describe('NestedRouter route param changes', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should re-render and fire lifecycle hooks when route params change', async () => {
    history.pushState(null, '', '/users/1')

    const callOrder: string[] = []
    const onVisitUser = vi.fn(async () => {
      callOrder.push('visit-user')
    })
    const onLeaveUser = vi.fn(async () => {
      callOrder.push('leave-user')
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="user-1" path="/users/1">
              User 1
            </NestedRouteLink>
            <NestedRouteLink id="user-2" path="/users/2">
              User 2
            </NestedRouteLink>
            <NestedRouteLink id="user-3" path="/users/3">
              User 3
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/users/:id': {
                  component: ({ match }) => <div id="content">user-{(match.params as { id: string }).id}</div>,
                  onVisit: onVisitUser,
                  onLeave: onLeaveUser,
                },
              }}
            />
          </div>
        ),
      })

      const getContent = () => document.getElementById('content')?.innerHTML
      const clickOn = (name: string) => document.getElementById(name)?.click()

      // Initial load at /users/1
      await flushUpdates()
      expect(getContent()).toBe('user-1')
      expect(onVisitUser).toHaveBeenCalledTimes(1)
      expect(callOrder).toEqual(['visit-user'])

      // Navigate to /users/2 — same route, different param → lifecycle should fire
      callOrder.length = 0
      clickOn('user-2')
      await flushUpdates()
      expect(getContent()).toBe('user-2')
      expect(onLeaveUser).toHaveBeenCalledTimes(1)
      expect(onVisitUser).toHaveBeenCalledTimes(2)
      expect(callOrder).toEqual(['leave-user', 'visit-user'])

      // Navigate to /users/3
      callOrder.length = 0
      clickOn('user-3')
      await flushUpdates()
      expect(getContent()).toBe('user-3')
      expect(onLeaveUser).toHaveBeenCalledTimes(2)
      expect(onVisitUser).toHaveBeenCalledTimes(3)
      expect(callOrder).toEqual(['leave-user', 'visit-user'])

      // Click same user — no lifecycle change
      callOrder.length = 0
      clickOn('user-3')
      await flushUpdates()
      expect(getContent()).toBe('user-3')
      expect(onLeaveUser).toHaveBeenCalledTimes(2)
      expect(onVisitUser).toHaveBeenCalledTimes(3)
      expect(callOrder).toEqual([])
    })
  })

  it('should re-render nested child when parent params change', async () => {
    history.pushState(null, '', '/org/alpha/dashboard')

    const onVisitOrg = vi.fn()
    const onLeaveOrg = vi.fn()
    const onVisitDash = vi.fn()
    const onLeaveDash = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="alpha-dash" path="/org/alpha/dashboard">
              Alpha Dashboard
            </NestedRouteLink>
            <NestedRouteLink id="beta-dash" path="/org/beta/dashboard">
              Beta Dashboard
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/org/:orgId': {
                  component: ({ match, outlet }) => (
                    <div id="org">
                      org-{(match.params as { orgId: string }).orgId}
                      {outlet}
                    </div>
                  ),
                  onVisit: onVisitOrg,
                  onLeave: onLeaveOrg,
                  children: {
                    '/dashboard': {
                      component: () => <div id="child">dashboard</div>,
                      onVisit: onVisitDash,
                      onLeave: onLeaveDash,
                    },
                  },
                },
              }}
            />
          </div>
        ),
      })

      const clickOn = (name: string) => document.getElementById(name)?.click()

      await flushUpdates()
      expect(document.getElementById('org')?.textContent).toContain('org-alpha')
      expect(document.getElementById('child')?.innerHTML).toBe('dashboard')
      expect(onVisitOrg).toHaveBeenCalledTimes(1)
      expect(onVisitDash).toHaveBeenCalledTimes(1)

      // Change parent param: org/alpha → org/beta, child stays /dashboard
      // Both parent and child should get leave/visit since parent diverges
      clickOn('beta-dash')
      await flushUpdates()
      await flushUpdates()
      expect(document.getElementById('org')?.textContent).toContain('org-beta')
      expect(document.getElementById('child')?.innerHTML).toBe('dashboard')
      expect(onLeaveOrg).toHaveBeenCalledTimes(1)
      expect(onLeaveDash).toHaveBeenCalledTimes(1)
      expect(onVisitOrg).toHaveBeenCalledTimes(2)
      expect(onVisitDash).toHaveBeenCalledTimes(2)
    })
  })
})

describe('NestedRouter + RouteMatchService integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should update RouteMatchService with the current match chain on navigation', async () => {
    history.pushState(null, '', '/parent/child-a')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      const parentRoute: NestedRoute = {
        meta: { title: 'Parent' },
        component: ({ outlet }) => <div>{outlet ?? <div>parent-index</div>}</div>,
        children: {
          '/child-a': {
            meta: { title: 'Child A' },
            component: () => <div id="content">child-a</div>,
          },
          '/child-b': {
            meta: { title: 'Child B' },
            component: () => <div id="content">child-b</div>,
          },
        },
      }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="child-a" path="/parent/child-a">
              child-a
            </NestedRouteLink>
            <NestedRouteLink id="child-b" path="/parent/child-b">
              child-b
            </NestedRouteLink>
            <NestedRouteLink id="nowhere" path="/nowhere">
              nowhere
            </NestedRouteLink>
            <NestedRouter routes={{ '/parent': parentRoute }} notFound={<div id="content">not found</div>} />
          </div>
        ),
      })

      // Initial load
      await flushUpdates()
      const initialChain = routeMatchService.currentMatchChain.getValue()
      expect(initialChain).toHaveLength(2)
      expect(initialChain[0].route.meta?.title).toBe('Parent')
      expect(initialChain[1].route.meta?.title).toBe('Child A')

      // Navigate to sibling child
      document.getElementById('child-b')?.click()
      await flushUpdates()
      const updatedChain = routeMatchService.currentMatchChain.getValue()
      expect(updatedChain).toHaveLength(2)
      expect(updatedChain[0].route.meta?.title).toBe('Parent')
      expect(updatedChain[1].route.meta?.title).toBe('Child B')

      // Navigate to not-found
      document.getElementById('nowhere')?.click()
      await flushUpdates()
      const notFoundChain = routeMatchService.currentMatchChain.getValue()
      expect(notFoundChain).toEqual([])
    })
  })

  it('should expose match params through RouteMatchService', async () => {
    history.pushState(null, '', '/users/42')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NestedRouter
            routes={{
              '/users/:id': {
                meta: {
                  title: ({ match }: { match: { params: Record<string, string> } }) => `User ${match.params.id}`,
                },
                component: ({ match }) => <div id="content">user-{(match.params as { id: string }).id}</div>,
              },
            }}
          />
        ),
      })

      await flushUpdates()
      const chain = routeMatchService.currentMatchChain.getValue()
      expect(chain).toHaveLength(1)
      expect(chain[0].match.params).toEqual({ id: '42' })
    })
  })
})

describe('resolveViewTransition', () => {
  const makeEntry = (viewTransition?: boolean | { types?: string[] }): MatchChainEntry => ({
    route: { component: () => <div />, viewTransition },
    match: { path: '/', params: {} },
    query: null,
    hash: undefined,
  })

  it('should return false when router config is undefined and route has no override', () => {
    expect(resolveViewTransition(undefined, [makeEntry()])).toBe(false)
  })

  it('should return false when router config is false', () => {
    expect(resolveViewTransition(false, [makeEntry()])).toBe(false)
  })

  it('should return config when router config is true', () => {
    expect(resolveViewTransition(true, [makeEntry()])).toEqual({ types: undefined })
  })

  it('should return false when router is true but leaf route opts out', () => {
    expect(resolveViewTransition(true, [makeEntry(false)])).toBe(false)
  })

  it('should use router-level types when route has no override', () => {
    expect(resolveViewTransition({ types: ['slide'] }, [makeEntry()])).toEqual({ types: ['slide'] })
  })

  it('should prefer route-level types over router-level types', () => {
    expect(resolveViewTransition({ types: ['slide'] }, [makeEntry({ types: ['fade'] })])).toEqual({
      types: ['fade'],
    })
  })

  it('should enable transitions when only the leaf route enables it', () => {
    expect(resolveViewTransition(undefined, [makeEntry(true)])).toEqual({ types: undefined })
  })

  it('should use types from the innermost (leaf) route in a chain', () => {
    const parent = makeEntry({ types: ['parent-type'] })
    const child = makeEntry({ types: ['child-type'] })
    expect(resolveViewTransition(true, [parent, child])).toEqual({ types: ['child-type'] })
  })
})

describe('NestedRouter view transitions', () => {
  let startViewTransitionSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    startViewTransitionSpy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
      const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
      update?.()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition
    })
    document.startViewTransition = startViewTransitionSpy as typeof document.startViewTransition
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  it('should call startViewTransition when viewTransition is enabled', async () => {
    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouter
              viewTransition
              routes={{
                '/about': { component: () => <div id="content">about</div> },
                '/': { component: () => <div id="content">home</div> },
              }}
            />
          </div>
        ),
      })

      await flushUpdates()
      startViewTransitionSpy.mockClear()

      document.getElementById('go-about')?.click()
      await flushUpdates()

      expect(startViewTransitionSpy).toHaveBeenCalledTimes(1)
      expect(document.getElementById('content')?.innerHTML).toBe('about')
    })
  })

  it('should not call startViewTransition when viewTransition is not set', async () => {
    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouter
              routes={{
                '/about': { component: () => <div id="content">about</div> },
                '/': { component: () => <div id="content">home</div> },
              }}
            />
          </div>
        ),
      })

      await flushUpdates()
      startViewTransitionSpy.mockClear()

      document.getElementById('go-about')?.click()
      await flushUpdates()

      expect(startViewTransitionSpy).not.toHaveBeenCalled()
      expect(document.getElementById('content')?.innerHTML).toBe('about')
    })
  })

  it('should pass types to startViewTransition when configured', async () => {
    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouter
              viewTransition={{ types: ['slide'] }}
              routes={{
                '/about': { component: () => <div id="content">about</div> },
                '/': { component: () => <div id="content">home</div> },
              }}
            />
          </div>
        ),
      })

      await flushUpdates()
      startViewTransitionSpy.mockClear()

      document.getElementById('go-about')?.click()
      await flushUpdates()

      expect(startViewTransitionSpy).toHaveBeenCalledWith(expect.objectContaining({ types: ['slide'] }))
    })
  })

  it('should respect per-route viewTransition: false override', async () => {
    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouter
              viewTransition
              routes={{
                '/about': {
                  component: () => <div id="content">about</div>,
                  viewTransition: false,
                },
                '/': { component: () => <div id="content">home</div> },
              }}
            />
          </div>
        ),
      })

      await flushUpdates()
      startViewTransitionSpy.mockClear()

      document.getElementById('go-about')?.click()
      await flushUpdates()

      expect(startViewTransitionSpy).not.toHaveBeenCalled()
      expect(document.getElementById('content')?.innerHTML).toBe('about')
    })
  })

  it('should fall back gracefully when startViewTransition is not available', async () => {
    delete (document as unknown as Record<string, unknown>).startViewTransition

    history.pushState(null, '', '/')

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <NestedRouteLink id="go-about" path="/about">
              about
            </NestedRouteLink>
            <NestedRouter
              viewTransition
              routes={{
                '/about': { component: () => <div id="content">about</div> },
                '/': { component: () => <div id="content">home</div> },
              }}
            />
          </div>
        ),
      })

      await flushUpdates()

      document.getElementById('go-about')?.click()
      await flushUpdates()

      expect(document.getElementById('content')?.innerHTML).toBe('about')
    })
  })
})
