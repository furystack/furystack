import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreenService, ScreenSizes } from './screen-service.js'

describe('ScreenService', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('Should be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const s = i.getInstance(ScreenService)
      expect(s).toBeInstanceOf(ScreenService)
    })
  })

  describe('breakpoints', () => {
    it('Should have correct breakpoint definitions', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)

        expect(s.breakpoints.xs.minSize).toBe(0)
        expect(s.breakpoints.sm.minSize).toBe(600)
        expect(s.breakpoints.md.minSize).toBe(960)
        expect(s.breakpoints.lg.minSize).toBe(1280)
        expect(s.breakpoints.xl.minSize).toBe(1920)
      })
    })
  })

  describe('screenSize.atLeast', () => {
    it('Should have observable for each screen size', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)

        for (const size of ScreenSizes) {
          expect(s.screenSize.atLeast[size]).toBeDefined()
          expect(typeof s.screenSize.atLeast[size].getValue()).toBe('boolean')
        }
      })
    })

    it('Should return true for xs on any screen size', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)
        // xs has minSize 0, so it should always be true
        expect(s.screenSize.atLeast.xs.getValue()).toBe(true)
      })
    })

    it('Should update screenSize observables on window resize', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)

        // Mock window.innerWidth to simulate a large screen
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1920)

        // Trigger resize event
        window.dispatchEvent(new Event('resize'))

        // All breakpoints should be true for 1920px width
        expect(s.screenSize.atLeast.xs.getValue()).toBe(true)
        expect(s.screenSize.atLeast.sm.getValue()).toBe(true)
        expect(s.screenSize.atLeast.md.getValue()).toBe(true)
        expect(s.screenSize.atLeast.lg.getValue()).toBe(true)
        expect(s.screenSize.atLeast.xl.getValue()).toBe(true)

        // Mock a small screen
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(500)
        window.dispatchEvent(new Event('resize'))

        // Only xs should be true for 500px width
        expect(s.screenSize.atLeast.xs.getValue()).toBe(true)
        expect(s.screenSize.atLeast.sm.getValue()).toBe(false)
        expect(s.screenSize.atLeast.md.getValue()).toBe(false)
        expect(s.screenSize.atLeast.lg.getValue()).toBe(false)
        expect(s.screenSize.atLeast.xl.getValue()).toBe(false)
      })
    })
  })

  describe('orientation', () => {
    it('Should have an orientation observable', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)
        const orientation = s.orientation.getValue()
        expect(['landscape', 'portrait']).toContain(orientation)
      })
    })

    it('Should update orientation on resize', async () => {
      await usingAsync(new Injector(), async (i) => {
        const s = i.getInstance(ScreenService)

        // Mock matchMedia to return landscape
        vi.spyOn(window, 'matchMedia').mockReturnValue({
          matches: true,
        } as MediaQueryList)

        window.dispatchEvent(new Event('resize'))
        expect(s.orientation.getValue()).toBe('landscape')

        // Mock matchMedia to return portrait
        vi.spyOn(window, 'matchMedia').mockReturnValue({
          matches: false,
        } as MediaQueryList)

        window.dispatchEvent(new Event('resize'))
        expect(s.orientation.getValue()).toBe('portrait')
      })
    })
  })

  describe('disposal', () => {
    it('Should remove resize event listener on dispose', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      await usingAsync(new Injector(), async (i) => {
        i.getInstance(ScreenService)
      })

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })
})
