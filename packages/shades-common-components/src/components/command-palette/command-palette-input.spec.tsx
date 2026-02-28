import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandPaletteInput } from './command-palette-input.js'
import { CommandPaletteManager } from './command-palette-manager.js'

describe('CommandPaletteInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  const createManager = () => {
    return new CommandPaletteManager([])
  }

  it('should render as custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const input = document.querySelector('shades-command-palette-input')
        expect(input).not.toBeNull()
      })
    })
  })

  it('should render an input element with placeholder', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const inputElement = component?.querySelector('input')
        expect(inputElement).not.toBeNull()
        expect(inputElement?.placeholder).toBe('Type to search commands...')
      })
    })
  })

  it('should always have width 100%', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        manager.isOpened.setValue(false)
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const computedStyle = window.getComputedStyle(component)
        expect(computedStyle.width).toBe('100%')
      })
    })
  })

  it('should have overflow hidden style', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const computedStyle = window.getComputedStyle(component)
        expect(computedStyle.overflow).toBe('hidden')
      })
    })
  })

  it('should focus input when opened', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        manager.isOpened.setValue(false)
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const inputElement = component?.querySelector('input') as HTMLInputElement
        const focusSpy = vi.spyOn(inputElement, 'focus')

        manager.isOpened.setValue(true)
        await flushUpdates()

        expect(focusSpy).toHaveBeenCalled()
      })
    })
  })

  it('should clear input value when closing', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        manager.isOpened.setValue(true)
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const inputElement = component?.querySelector('input') as HTMLInputElement
        inputElement.value = 'search term'

        manager.isOpened.setValue(false)
        await flushUpdates()

        expect(inputElement.value).toBe('')
      })
    })
  })

  it('should preserve input value when opening', async () => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(createManager(), async (manager) => {
        manager.isOpened.setValue(false)
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPaletteInput manager={manager} />,
        })

        await flushUpdates()

        const component = document.querySelector('shades-command-palette-input') as HTMLElement
        const inputElement = component?.querySelector('input') as HTMLInputElement
        inputElement.value = 'some text'

        manager.isOpened.setValue(true)
        await flushUpdates()

        expect(inputElement.value).toBe('some text')
      })
    })
  })
})
