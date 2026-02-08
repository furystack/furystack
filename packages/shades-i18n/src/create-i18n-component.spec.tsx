import { I18NService } from '@furystack/i18n'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18nComponent } from './create-i18n-component.js'

type TestKeys = 'hello' | 'goodbye' | 'world'

const createTestService = () => {
  return new I18NService<TestKeys>(
    {
      code: 'en',
      values: {
        hello: 'Hello',
        goodbye: 'Goodbye',
        world: 'World',
      },
    },
    {
      code: 'hu',
      values: {
        hello: 'Szia',
        goodbye: 'Viszlát',
        world: 'Világ',
      },
    },
    {
      code: 'de',
      values: {
        hello: 'Hallo',
        goodbye: 'Auf Wiedersehen',
      },
    },
  )
}

describe('createI18nComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with the initial translation', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-initial',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="hello" />,
      })

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Hello')
    })
  })

  it('should render with the correct translation for different keys', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-keys',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <>
            <I18n key="hello" />
            <span> </span>
            <I18n key="world" />
          </>
        ),
      })

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Hello World')
    })
  })

  it('should update when language changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-language-change',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="hello" />,
      })

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Hello')

      service.currentLanguage = 'hu'
      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Szia')

      service.currentLanguage = 'de'
      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Hallo')
    })
  })

  it('should fallback to default language for missing keys', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-fallback',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="world" />,
      })

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('World')

      // German doesn't have 'world' translation, should fallback to English
      service.currentLanguage = 'de'
      await sleepAsync(50)
      expect(rootElement.textContent).toBe('World')
    })
  })

  it('should handle rapid language changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-rapid-changes',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="hello" />,
      })

      await sleepAsync(50)

      // Rapid language changes
      service.currentLanguage = 'hu'
      service.currentLanguage = 'de'
      service.currentLanguage = 'en'
      service.currentLanguage = 'hu'

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Szia')
    })
  })

  it('should cleanup subscription on unmount', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const unsubscribeSpy = vi.fn()
      const originalSubscribe = service.subscribe.bind(service)
      vi.spyOn(service, 'subscribe').mockImplementation((event, callback) => {
        const subscription = originalSubscribe(event, callback)
        return {
          [Symbol.dispose]: () => {
            unsubscribeSpy()
            subscription[Symbol.dispose]()
          },
        }
      })

      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-cleanup',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="hello" />,
      })

      await sleepAsync(50)
      expect(unsubscribeSpy).not.toHaveBeenCalled()

      // Unmount by clearing the DOM
      document.body.innerHTML = ''
      await sleepAsync(50)

      expect(unsubscribeSpy).toHaveBeenCalled()
    })
  })

  it('should render as span element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-span',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <I18n key="hello" />,
      })

      await sleepAsync(50)
      // The component uses elementBaseName: 'span', so it renders as <span is="test-i18n-span">
      const i18nElement = rootElement.querySelector('span[is="test-i18n-span"]')
      expect(i18nElement).toBeInstanceOf(HTMLSpanElement)
    })
  })

  it('should work with multiple instances using different keys', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = createTestService()
      const I18n = createI18nComponent({
        service,
        tagName: 'test-i18n-multiple',
      })

      const rootElement = document.getElementById('root') as HTMLDivElement
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div>
            <I18n key="hello" />
            {' - '}
            <I18n key="goodbye" />
          </div>
        ),
      })

      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Hello - Goodbye')

      service.currentLanguage = 'hu'
      await sleepAsync(50)
      expect(rootElement.textContent).toBe('Szia - Viszlát')
    })
  })
})
