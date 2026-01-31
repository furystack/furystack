import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandPaletteSuggestionResult, CommandProvider } from './command-provider.js'
import { CommandPalette } from './index.js'

describe('CommandPalette', () => {
  let originalAnimate: typeof Element.prototype.animate

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    originalAnimate = Element.prototype.animate

    Element.prototype.animate = vi.fn(() => {
      const mockAnimation = {
        onfinish: null as ((event: AnimationPlaybackEvent) => void) | null,
        oncancel: null as ((event: AnimationPlaybackEvent) => void) | null,
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        finish: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      return mockAnimation as unknown as Animation
    }) as typeof Element.prototype.animate
  })

  afterEach(() => {
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
    vi.restoreAllMocks()
  })

  const createMockProvider = (results: CommandPaletteSuggestionResult[]): CommandProvider => {
    return vi.fn(async () => results)
  }

  const createSuggestion = (
    text: string,
    score: number,
    onSelected: (options: { injector: Injector }) => void = vi.fn(),
  ): CommandPaletteSuggestionResult => ({
    element: <span>{text}</span>,
    score,
    onSelected,
  })

  describe('rendering', () => {
    it('should render the shade-command-palette custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette')
        expect(commandPalette).not.toBeNull()
        expect(commandPalette?.tagName.toLowerCase()).toBe('shade-command-palette')
      })
    })

    it('should render the default prefix', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        expect(document.body.innerHTML).toContain('>')
      })
    })

    it('should render input component', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shades-command-palette-input')
        expect(input).not.toBeNull()
      })
    })

    it('should render suggestion list component', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const suggestionList = document.querySelector('shade-command-palette-suggestion-list')
        expect(suggestionList).not.toBeNull()
      })
    })
  })

  describe('keyboard navigation', () => {
    const triggerKeyup = (input: HTMLInputElement, key: string) => {
      const event = new KeyboardEvent('keyup', { key, bubbles: true })
      Object.defineProperty(event, 'target', { value: input, writable: false })
      input.dispatchEvent(event)
    }

    const getSuggestionItems = (commandPalette: HTMLElement) => {
      const suggestionList = commandPalette.querySelector('shade-command-palette-suggestion-list') as HTMLElement
      return suggestionList?.querySelectorAll('.suggestion-item') || []
    }

    it('should navigate down with ArrowDown key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([
          createSuggestion('Item 1', 100),
          createSuggestion('Item 2', 90),
          createSuggestion('Item 3', 80),
        ])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        // Open and trigger suggestions
        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Press ArrowDown
        triggerKeyup(input, 'ArrowDown')
        await sleepAsync(50)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems[1]?.classList.contains('selected')).toBe(true)
      })
    })

    it('should navigate up with ArrowUp key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([
          createSuggestion('Item 1', 100),
          createSuggestion('Item 2', 90),
          createSuggestion('Item 3', 80),
        ])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        // Open and trigger suggestions
        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Navigate down then up
        triggerKeyup(input, 'ArrowDown')
        await sleepAsync(50)
        triggerKeyup(input, 'ArrowUp')
        await sleepAsync(50)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems[0]?.classList.contains('selected')).toBe(true)
      })
    })

    it('should not navigate below the last item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([createSuggestion('Item 1', 100), createSuggestion('Item 2', 90)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Press ArrowDown multiple times
        triggerKeyup(input, 'ArrowDown')
        triggerKeyup(input, 'ArrowDown')
        triggerKeyup(input, 'ArrowDown')
        await sleepAsync(50)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems[1]?.classList.contains('selected')).toBe(true)
      })
    })

    it('should not navigate above the first item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([createSuggestion('Item 1', 100), createSuggestion('Item 2', 90)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Press ArrowUp when already at first item
        triggerKeyup(input, 'ArrowUp')
        await sleepAsync(50)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems[0]?.classList.contains('selected')).toBe(true)
      })
    })

    it('should select suggestion on Enter key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const onSelected = vi.fn()
        const provider = createMockProvider([createSuggestion('Item 1', 100, onSelected)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Press Enter
        triggerKeyup(input, 'Enter')
        await sleepAsync(50)

        expect(onSelected).toHaveBeenCalledTimes(1)
        expect(onSelected).toHaveBeenCalledWith(expect.objectContaining({ injector: expect.any(Injector) as unknown }))
      })
    })
  })

  describe('selection', () => {
    const triggerKeyup = (input: HTMLInputElement, key: string) => {
      const event = new KeyboardEvent('keyup', { key, bubbles: true })
      Object.defineProperty(event, 'target', { value: input, writable: false })
      input.dispatchEvent(event)
    }

    const getSuggestionItems = (commandPalette: HTMLElement) => {
      const suggestionList = commandPalette.querySelector('shade-command-palette-suggestion-list') as HTMLElement
      return suggestionList?.querySelectorAll('.suggestion-item') || []
    }

    it('should close palette when clicking a suggestion', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([createSuggestion('Item 1', 100), createSuggestion('Item 2', 90)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement

        // Open palette by clicking prefix
        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(100) // Wait longer for the opened state to propagate

        expect(commandPalette.classList.contains('opened')).toBe(true)

        const input = commandPalette.querySelector('input') as HTMLInputElement
        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Click on first suggestion
        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems.length).toBeGreaterThan(0)
        ;(suggestionItems[0] as HTMLElement).click()
        await sleepAsync(100)

        // Clicking a suggestion should close the palette
        expect(commandPalette.classList.contains('opened')).toBe(false)
      })
    })

    it('should close palette after selection', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([createSuggestion('Item 1', 100)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement

        // Open palette
        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(50)

        expect(commandPalette.classList.contains('opened')).toBe(true)

        const input = commandPalette.querySelector('input') as HTMLInputElement
        input.value = 'test'
        triggerKeyup(input, 'a')

        await sleepAsync(300)

        // Select via Enter
        triggerKeyup(input, 'Enter')
        await sleepAsync(50)

        expect(commandPalette.classList.contains('opened')).toBe(false)
      })
    })
  })

  describe('command providers', () => {
    const triggerKeyup = (input: HTMLInputElement, key: string) => {
      const event = new KeyboardEvent('keyup', { key, bubbles: true })
      Object.defineProperty(event, 'target', { value: input, writable: false })
      input.dispatchEvent(event)
    }

    const getSuggestionItems = (commandPalette: HTMLElement) => {
      const suggestionList = commandPalette.querySelector('shade-command-palette-suggestion-list') as HTMLElement
      return suggestionList?.querySelectorAll('.suggestion-item') || []
    }

    it('should call all command providers when searching', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider1 = createMockProvider([createSuggestion('Provider 1 Result', 100)])
        const provider2 = createMockProvider([createSuggestion('Provider 2 Result', 90)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider1, provider2]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'search'
        triggerKeyup(input, 'h')

        await sleepAsync(300)

        expect(provider1).toHaveBeenCalled()
        expect(provider2).toHaveBeenCalled()
      })
    })

    it('should aggregate results from multiple providers', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider1 = createMockProvider([createSuggestion('Provider 1 Result', 100)])
        const provider2 = createMockProvider([createSuggestion('Provider 2 Result', 90)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider1, provider2]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'search'
        triggerKeyup(input, 'h')

        await sleepAsync(300)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems.length).toBe(2)
        expect(document.body.innerHTML).toContain('Provider 1 Result')
        expect(document.body.innerHTML).toContain('Provider 2 Result')
      })
    })

    it('should sort results by score', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([
          createSuggestion('Low Score', 50),
          createSuggestion('High Score', 100),
          createSuggestion('Medium Score', 75),
        ])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'search'
        triggerKeyup(input, 'h')

        await sleepAsync(300)

        const suggestionItems = getSuggestionItems(commandPalette)
        expect(suggestionItems.length).toBe(3)

        // Results should be sorted by score ascending (sortBy sorts ascending)
        expect(suggestionItems[0]?.textContent).toContain('Low Score')
        expect(suggestionItems[1]?.textContent).toContain('Medium Score')
        expect(suggestionItems[2]?.textContent).toContain('High Score')
      })
    })
  })

  describe('opening and closing', () => {
    it('should open when clicking the prefix icon', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        expect(commandPalette.classList.contains('opened')).toBe(false)

        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(50)

        expect(commandPalette.classList.contains('opened')).toBe(true)
      })
    })

    it('should close when clicking the close button', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement

        // Open first
        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(50)
        expect(commandPalette.classList.contains('opened')).toBe(true)

        // Close
        const closeButton = commandPalette.querySelector('.close-suggestions') as HTMLElement
        closeButton.click()
        await sleepAsync(50)

        expect(commandPalette.classList.contains('opened')).toBe(false)
      })
    })

    it('should add loading class when fetching suggestions', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = vi.fn(
          () =>
            new Promise<CommandPaletteSuggestionResult[]>((resolve) => {
              setTimeout(() => resolve([createSuggestion('Result', 100)]), 100)
            }),
        )

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const input = commandPalette.querySelector('input') as HTMLInputElement

        input.value = 'test'
        const event = new KeyboardEvent('keyup', { key: 't', bubbles: true })
        Object.defineProperty(event, 'target', { value: input, writable: false })
        input.dispatchEvent(event)

        await sleepAsync(260) // After debounce but before provider resolves

        expect(commandPalette.classList.contains('loading')).toBe(true)

        await sleepAsync(200) // Wait for provider to resolve

        expect(commandPalette.classList.contains('loading')).toBe(false)
      })
    })
  })

  describe('click away', () => {
    it('should close when clicking outside the component', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <div>
              <div id="outside">Outside element</div>
              <CommandPalette commandProviders={[]} defaultPrefix=">" />
            </div>
          ),
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement

        // Open first
        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(50)
        expect(commandPalette.classList.contains('opened')).toBe(true)

        // Click outside
        const outsideElement = document.getElementById('outside') as HTMLElement
        outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await sleepAsync(50)

        expect(commandPalette.classList.contains('opened')).toBe(false)
      })
    })
  })

  describe('styling', () => {
    it('should apply custom style to input container', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[]} defaultPrefix=">" style={{ maxWidth: '500px' }} />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement
        const inputContainer = commandPalette.querySelector('.input-container') as HTMLElement

        expect(inputContainer.style.maxWidth).toBe('500px')
      })
    })

    it('should pass fullScreenSuggestions to suggestion list', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const provider = createMockProvider([createSuggestion('Item', 100)])

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CommandPalette commandProviders={[provider]} defaultPrefix=">" fullScreenSuggestions />,
        })

        await sleepAsync(50)

        const commandPalette = document.querySelector('shade-command-palette') as HTMLElement

        // Open and search
        const termIcon = commandPalette.querySelector('.term-icon') as HTMLElement
        termIcon.click()
        await sleepAsync(50)

        const input = commandPalette.querySelector('input') as HTMLInputElement
        input.value = 'test'
        const event = new KeyboardEvent('keyup', { key: 't', bubbles: true })
        Object.defineProperty(event, 'target', { value: input, writable: false })
        input.dispatchEvent(event)

        await sleepAsync(300)

        const suggestionList = commandPalette.querySelector('shade-command-palette-suggestion-list') as HTMLElement
        const suggestionContainer = suggestionList.querySelector('.suggestion-items-container') as HTMLElement
        // fullScreenSuggestions sets left: '0' and specific width
        expect(suggestionContainer.style.left).toBe('0px')
      })
    })
  })
})
