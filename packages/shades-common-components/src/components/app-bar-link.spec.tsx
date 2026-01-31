import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppBarLink } from './app-bar-link.js'

describe('AppBarLink component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render the shade-app-bar-link custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/test">Link</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink).not.toBeNull()
        expect(appBarLink?.tagName.toLowerCase()).toBe('shade-app-bar-link')
      })
    })

    it('should render children through RouteLink', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/test">Test Link Text</AppBarLink>,
        })

        await sleepAsync(50)

        expect(document.body.innerHTML).toContain('Test Link Text')
      })
    })

    it('should render RouteLink with correct href', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/my-route">Link</AppBarLink>,
        })

        await sleepAsync(50)

        expect(document.body.innerHTML).toContain('href="/my-route"')
      })
    })
  })

  describe('route matching', () => {
    it('should have active class when current URL matches href', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/dashboard')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/dashboard">Dashboard</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(true)
      })
    })

    it('should not have active class when current URL does not match href', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/other-page')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/dashboard">Dashboard</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(false)
      })
    })

    it('should update active class when location changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/home')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/dashboard">Dashboard</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(false)

        // Navigate to matching route
        history.pushState(null, '', '/dashboard')
        injector.getInstance(LocationService).updateState()

        await sleepAsync(50)

        expect(appBarLink?.classList.contains('active')).toBe(true)
      })
    })

    it('should remove active class when navigating away', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/dashboard')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/dashboard">Dashboard</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(true)

        // Navigate away
        history.pushState(null, '', '/other')
        injector.getInstance(LocationService).updateState()

        await sleepAsync(50)

        expect(appBarLink?.classList.contains('active')).toBe(false)
      })
    })

    it('should match routes with parameters', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/users/123')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/users/:id">Users</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(true)
      })
    })

    it('should support routingOptions with end: false for prefix matching', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/admin/settings/security')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <AppBarLink href="/admin" routingOptions={{ end: false }}>
              Admin
            </AppBarLink>
          ),
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(true)
      })
    })

    it('should not match prefix by default (end: true)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/admin/settings')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/admin">Admin</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link')
        expect(appBarLink?.classList.contains('active')).toBe(false)
      })
    })
  })

  describe('multiple links', () => {
    it('should only activate the matching link', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/settings')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <div>
              <AppBarLink href="/home">Home</AppBarLink>
              <AppBarLink href="/settings">Settings</AppBarLink>
              <AppBarLink href="/about">About</AppBarLink>
            </div>
          ),
        })

        await sleepAsync(50)

        const links = document.querySelectorAll('shade-app-bar-link')
        expect(links[0]?.classList.contains('active')).toBe(false)
        expect(links[1]?.classList.contains('active')).toBe(true)
        expect(links[2]?.classList.contains('active')).toBe(false)
      })
    })

    it('should update all links when location changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/home')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <div>
              <AppBarLink href="/home">Home</AppBarLink>
              <AppBarLink href="/settings">Settings</AppBarLink>
            </div>
          ),
        })

        await sleepAsync(50)

        const links = document.querySelectorAll('shade-app-bar-link')
        expect(links[0]?.classList.contains('active')).toBe(true)
        expect(links[1]?.classList.contains('active')).toBe(false)

        // Navigate to settings
        history.pushState(null, '', '/settings')
        injector.getInstance(LocationService).updateState()

        await sleepAsync(50)

        expect(links[0]?.classList.contains('active')).toBe(false)
        expect(links[1]?.classList.contains('active')).toBe(true)
      })
    })
  })

  describe('styling', () => {
    it('should have flex display', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/test">Link</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link') as HTMLElement
        const computedStyle = window.getComputedStyle(appBarLink)
        expect(computedStyle.display).toBe('flex')
      })
    })

    it('should have pointer cursor', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/test">Link</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link') as HTMLElement
        const computedStyle = window.getComputedStyle(appBarLink)
        expect(computedStyle.cursor).toBe('pointer')
      })
    })

    it('should have transition for animations', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <AppBarLink href="/test">Link</AppBarLink>,
        })

        await sleepAsync(50)

        const appBarLink = document.querySelector('shade-app-bar-link') as HTMLElement
        const computedStyle = window.getComputedStyle(appBarLink)
        expect(computedStyle.transition).toContain('color')
      })
    })
  })
})
