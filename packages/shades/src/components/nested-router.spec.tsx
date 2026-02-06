import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import {
  buildMatchChain,
  findDivergenceIndex,
  NestedRouter,
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
