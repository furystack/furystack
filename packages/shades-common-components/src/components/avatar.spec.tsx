import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Avatar } from './avatar.js'

describe('Avatar component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render an image with the provided avatarUrl', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const testUrl = 'https://example.com/avatar.png'

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Avatar avatarUrl={testUrl} />,
      })

      await flushUpdates()

      const avatar = document.querySelector('shade-avatar')
      expect(avatar).not.toBeNull()

      const img = avatar?.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.src).toBe(testUrl)
      expect(img?.alt).toBe('avatar image')
    })
  })

  it('should display default fallback icon when image fails to load', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Avatar avatarUrl="invalid-url" />,
      })

      await flushUpdates()

      const avatar = document.querySelector('shade-avatar')
      expect(avatar).not.toBeNull()

      const img = avatar?.querySelector('img')
      expect(img).not.toBeNull()

      // Trigger the error event
      const errorEvent = new Event('error')
      img?.dispatchEvent(errorEvent)

      await flushUpdates()

      // After error, img should be replaced with fallback div
      const fallbackImg = avatar?.querySelector('img')
      expect(fallbackImg).toBeNull()

      // The fallback div should contain the default Icon component (renders an SVG)
      const fallbackIcon = avatar?.querySelector('svg')
      expect(fallbackIcon).not.toBeNull()
    })
  })

  it('should display custom fallback when image fails to load and fallback prop is provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const customFallback = <span data-testid="custom-fallback">AB</span>

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Avatar avatarUrl="invalid-url" fallback={customFallback} />,
      })

      await flushUpdates()

      const avatar = document.querySelector('shade-avatar')
      expect(avatar).not.toBeNull()

      const img = avatar?.querySelector('img')
      expect(img).not.toBeNull()

      // Trigger the error event
      const errorEvent = new Event('error')
      img?.dispatchEvent(errorEvent)

      await flushUpdates()

      // After error, img should be replaced with fallback div
      const fallbackImg = avatar?.querySelector('img')
      expect(fallbackImg).toBeNull()

      // The custom fallback should be rendered
      const customElement = avatar?.querySelector('[data-testid="custom-fallback"]')
      expect(customElement).not.toBeNull()
      expect(customElement?.textContent).toBe('AB')
    })
  })

  it('should apply custom style from props', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Avatar avatarUrl="https://example.com/avatar.png" style={{ width: '64px', height: '64px' }} />,
      })

      await flushUpdates()

      const avatar = document.querySelector('shade-avatar') as HTMLElement
      expect(avatar).not.toBeNull()
      expect(avatar.style.width).toBe('64px')
      expect(avatar.style.height).toBe('64px')
    })
  })

  it('should pass through additional props to the container', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Avatar avatarUrl="https://example.com/avatar.png" className="custom-avatar" title="User Avatar" />,
      })

      await flushUpdates()

      const avatar = document.querySelector('shade-avatar') as HTMLElement
      expect(avatar).not.toBeNull()
      expect(avatar.className).toBe('custom-avatar')
      expect(avatar.title).toBe('User Avatar')
    })
  })
})
