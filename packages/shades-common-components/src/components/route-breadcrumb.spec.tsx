import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot, RouteMatchService } from '@furystack/shades'
import type { MatchChainEntry } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteBreadcrumb } from './route-breadcrumb.js'

const createMatchChainEntry = (
  path: string,
  title?: string | (({ match, injector }: { match: unknown; injector: unknown }) => Promise<string>),
): MatchChainEntry =>
  ({
    route: { meta: title != null ? { title } : undefined, component: () => <div /> },
    match: { path, params: {} },
    query: null,
    hash: undefined,
  }) as MatchChainEntry

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const flushAsync = async () => {
  await flushUpdates()
  await tick()
  await flushUpdates()
}

describe('RouteBreadcrumb', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should render items derived from the match chain', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/', 'Home'),
        createMatchChainEntry('/users', 'Users'),
        createMatchChainEntry('/profile', 'Profile'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav).toBeTruthy()
      expect(nav?.textContent).toContain('Users')
      expect(nav?.textContent).toContain('Profile')
    })
  })

  it('Should skip the root "/" segment by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/', 'Home'),
        createMatchChainEntry('/users', 'Users'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav?.textContent).not.toContain('Home')
      expect(nav?.textContent).toContain('Users')
    })
  })

  it('Should include root segment when skipRootPath is false', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/', 'Home'),
        createMatchChainEntry('/users', 'Users'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb skipRootPath={false} />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav?.textContent).toContain('Home')
      expect(nav?.textContent).toContain('Users')
    })
  })

  it('Should resolve async titles', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([createMatchChainEntry('/settings', async () => 'Settings')])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav?.textContent).toContain('Settings')
    })
  })

  it('Should skip entries without a title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/layout'),
        createMatchChainEntry('/users', 'Users'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav?.textContent).toContain('Users')
    })
  })

  it('Should pass through homeItem prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([createMatchChainEntry('/users', 'Users')])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb homeItem={{ path: '/', label: 'Home' }} />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav?.textContent).toContain('Home')
      expect(nav?.textContent).toContain('Users')
    })
  })

  it('Should pass through separator prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/users', 'Users'),
        createMatchChainEntry('/profile', 'Profile'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb separator=" › " />,
      })

      await flushAsync()

      const separator = rootElement.querySelector('[data-separator="true"]')
      expect(separator?.textContent).toBe(' › ')
    })
  })

  it('Should handle empty match chain gracefully', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb />,
      })

      await flushAsync()

      const nav = rootElement.querySelector('nav[is="shade-breadcrumb"]')
      expect(nav).toBeTruthy()
    })
  })

  it('Should accumulate paths from nested segments', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const routeMatchService = injector.getInstance(RouteMatchService)

      routeMatchService.currentMatchChain.setValue([
        createMatchChainEntry('/', 'Home'),
        createMatchChainEntry('/users', 'Users'),
        createMatchChainEntry('/profile', 'Profile'),
      ])

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RouteBreadcrumb lastItemClickable={true} />,
      })

      await flushAsync()

      const usersLink = rootElement.querySelector('a[href="/users"]')
      expect(usersLink).toBeTruthy()
      expect(usersLink?.textContent).toBe('Users')

      const profileLink = rootElement.querySelector('a[href="/users/profile"]')
      expect(profileLink).toBeTruthy()
      expect(profileLink?.textContent).toBe('Profile')
    })
  })
})
