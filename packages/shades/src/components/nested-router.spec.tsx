import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import {
  buildMatchChain,
  findDivergenceIndex,
  NestedRouter,
  renderMatchChain,
  type MatchChainEntry,
  type NestedRoute,
} from './nested-router.js'
import { RouteLink } from './route-link.js'

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
    const oldChain: MatchChainEntry[] = [{ route, match: { path: '/', params: { id: '1' } } }]
    const newChain: MatchChainEntry[] = [{ route, match: { path: '/', params: { id: '2' } } }]
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
      },
    ]

    renderMatchChain(chain, '/leaf')

    expect(componentFn).toHaveBeenCalledTimes(1)
    expect(componentFn).toHaveBeenCalledWith({
      currentUrl: '/leaf',
      match: { path: '/leaf', params: {} },
      outlet: undefined,
    })
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
      },
      {
        route: { component: childComponent },
        match: { path: '/child', params: {} },
      },
    ]

    renderMatchChain(chain, '/parent/child')

    expect(callOrder).toEqual(['child', 'parent'])
    expect(childComponent).toHaveBeenCalledWith(expect.objectContaining({ outlet: undefined }))
    expect(parentComponent).toHaveBeenCalledWith(expect.objectContaining({ outlet: expect.anything() as unknown }))
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
      { route: { component: parent }, match: { path: '/a', params: {} } },
      { route: { component: child }, match: { path: '/b', params: {} } },
      { route: { component: grandchild }, match: { path: '/c', params: {} } },
    ]

    renderMatchChain(chain, '/a/b/c')

    expect(urls).toEqual(['/a/b/c', '/a/b/c', '/a/b/c'])
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
            <RouteLink id="child-a" href="/parent/child-a">
              child-a
            </RouteLink>
            <RouteLink id="child-b" href="/parent/child-b">
              child-b
            </RouteLink>
            <RouteLink id="other" href="/other">
              other
            </RouteLink>
            <RouteLink id="nowhere" href="/nowhere">
              nowhere
            </RouteLink>
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
      await sleepAsync(100)
      expect(getContent()).toBe('child-a')
      expect(onVisitParent).toBeCalledTimes(1)
      expect(onVisitChildA).toBeCalledTimes(1)
      expect(callOrder).toEqual(['visit-parent', 'visit-child-a'])

      // --- Click same route: no lifecycle hooks should fire ---
      callOrder.length = 0
      clickOn('child-a')
      await sleepAsync(100)
      expect(onVisitParent).toBeCalledTimes(1)
      expect(onVisitChildA).toBeCalledTimes(1)
      expect(callOrder).toEqual([])

      // --- Switch child: only child lifecycle fires, parent stays ---
      callOrder.length = 0
      clickOn('child-b')
      await sleepAsync(100)
      expect(getContent()).toBe('child-b')
      expect(onLeaveChildA).toBeCalledTimes(1)
      expect(onVisitChildB).toBeCalledTimes(1)
      expect(onLeaveParent).not.toBeCalled()
      expect(onVisitParent).toBeCalledTimes(1)
      expect(callOrder).toEqual(['leave-child-a', 'visit-child-b'])

      // --- Navigate to a completely different branch ---
      callOrder.length = 0
      clickOn('other')
      await sleepAsync(100)
      expect(getContent()).toBe('other')
      expect(onLeaveChildB).toBeCalledTimes(1)
      expect(onLeaveParent).toBeCalledTimes(1)
      expect(onVisitOther).toBeCalledTimes(1)
      // onLeave fires innermost-first, then onVisit for the new branch
      expect(callOrder).toEqual(['leave-child-b', 'leave-parent', 'visit-other'])

      // --- Navigate to non-matching URL: onLeave for all active ---
      callOrder.length = 0
      clickOn('nowhere')
      await sleepAsync(100)
      expect(getContent()).toBe('not found')
      expect(onLeaveOther).toBeCalledTimes(1)
      expect(callOrder).toEqual(['leave-other'])
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
            <RouteLink id="home" href="/">
              home
            </RouteLink>
            <RouteLink id="about" href="/about">
              about
            </RouteLink>
            <RouteLink id="contact" href="/contact">
              contact
            </RouteLink>
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

      await sleepAsync(100)
      expect(getContent()).toBe('home-page')

      clickOn('about')
      await sleepAsync(100)
      expect(getContent()).toBe('about-page')

      clickOn('contact')
      await sleepAsync(100)
      expect(getContent()).toBe('contact-page')

      clickOn('home')
      await sleepAsync(100)
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

      await sleepAsync(100)

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

      await sleepAsync(100)

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
            <RouteLink id="user-1" href="/users/1">
              User 1
            </RouteLink>
            <RouteLink id="user-2" href="/users/2">
              User 2
            </RouteLink>
            <RouteLink id="user-3" href="/users/3">
              User 3
            </RouteLink>
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
      await sleepAsync(100)
      expect(getContent()).toBe('user-1')
      expect(onVisitUser).toHaveBeenCalledTimes(1)
      expect(callOrder).toEqual(['visit-user'])

      // Navigate to /users/2 — same route, different param → lifecycle should fire
      callOrder.length = 0
      clickOn('user-2')
      await sleepAsync(100)
      expect(getContent()).toBe('user-2')
      expect(onLeaveUser).toHaveBeenCalledTimes(1)
      expect(onVisitUser).toHaveBeenCalledTimes(2)
      expect(callOrder).toEqual(['leave-user', 'visit-user'])

      // Navigate to /users/3
      callOrder.length = 0
      clickOn('user-3')
      await sleepAsync(100)
      expect(getContent()).toBe('user-3')
      expect(onLeaveUser).toHaveBeenCalledTimes(2)
      expect(onVisitUser).toHaveBeenCalledTimes(3)
      expect(callOrder).toEqual(['leave-user', 'visit-user'])

      // Click same user — no lifecycle change
      callOrder.length = 0
      clickOn('user-3')
      await sleepAsync(100)
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
            <RouteLink id="alpha-dash" href="/org/alpha/dashboard">
              Alpha Dashboard
            </RouteLink>
            <RouteLink id="beta-dash" href="/org/beta/dashboard">
              Beta Dashboard
            </RouteLink>
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

      await sleepAsync(100)
      expect(document.getElementById('org')?.textContent).toContain('org-alpha')
      expect(document.getElementById('child')?.innerHTML).toBe('dashboard')
      expect(onVisitOrg).toHaveBeenCalledTimes(1)
      expect(onVisitDash).toHaveBeenCalledTimes(1)

      // Change parent param: org/alpha → org/beta, child stays /dashboard
      // Both parent and child should get leave/visit since parent diverges
      clickOn('beta-dash')
      await sleepAsync(100)
      expect(document.getElementById('org')?.textContent).toContain('org-beta')
      expect(document.getElementById('child')?.innerHTML).toBe('dashboard')
      expect(onLeaveOrg).toHaveBeenCalledTimes(1)
      expect(onLeaveDash).toHaveBeenCalledTimes(1)
      expect(onVisitOrg).toHaveBeenCalledTimes(2)
      expect(onVisitDash).toHaveBeenCalledTimes(2)
    })
  })
})
