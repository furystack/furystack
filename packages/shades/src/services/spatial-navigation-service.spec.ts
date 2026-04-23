import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpatialNavigationService, configureSpatialNavigation } from './spatial-navigation-service.js'

const mockRect = (el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) => {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  })
}

const createButton = (
  id: string,
  rect: { left: number; top: number; width: number; height: number },
): HTMLButtonElement => {
  const btn = document.createElement('button')
  btn.id = id
  btn.textContent = id
  mockRect(btn, rect)
  btn.scrollIntoView = vi.fn()
  return btn
}

const pressKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('SpatialNavigationService', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('Should be constructed via injector', async () => {
    await usingAsync(createInjector(), async (i) => {
      const s = i.get(SpatialNavigationService)
      expect(s).toBeDefined()
      expect(typeof s.moveFocus).toBe('function')
    })
  })

  it('Should be enabled by default', async () => {
    await usingAsync(createInjector(), async (i) => {
      const s = i.get(SpatialNavigationService)
      expect(s.enabled.getValue()).toBe(true)
    })
  })

  it('Should have null activeSection initially', async () => {
    await usingAsync(createInjector(), async (i) => {
      const s = i.get(SpatialNavigationService)
      expect(s.activeSection.getValue()).toBeNull()
    })
  })

  describe('focus movement', () => {
    it('Should move focus to the right', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()
        expect(document.activeElement).toBe(left)

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(right)
      })
    })

    it('Should move focus to the left', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        right.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('left')
        expect(document.activeElement).toBe(left)
      })
    })

    it('Should move focus down', async () => {
      await usingAsync(createInjector(), async (i) => {
        const top = createButton('top', { left: 0, top: 0, width: 50, height: 50 })
        const bottom = createButton('bottom', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(top, bottom)

        top.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(document.activeElement).toBe(bottom)
      })
    })

    it('Should move focus up', async () => {
      await usingAsync(createInjector(), async (i) => {
        const top = createButton('top', { left: 0, top: 0, width: 50, height: 50 })
        const bottom = createButton('bottom', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(top, bottom)

        bottom.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('up')
        expect(document.activeElement).toBe(top)
      })
    })

    it('Should select nearest element by Euclidean distance', async () => {
      await usingAsync(createInjector(), async (i) => {
        const origin = createButton('origin', { left: 0, top: 0, width: 50, height: 50 })
        const near = createButton('near', { left: 100, top: 10, width: 50, height: 50 })
        const far = createButton('far', { left: 300, top: 10, width: 50, height: 50 })
        document.body.append(origin, near, far)

        origin.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(near)
      })
    })

    it('Should be a no-op when no candidate exists in the direction', async () => {
      await usingAsync(createInjector(), async (i) => {
        const only = createButton('only', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(only)

        only.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(only)
      })
    })

    it('Should call scrollIntoView on the target element', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(right.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
      })
    })
  })

  describe('initial focus', () => {
    it('Should focus first element when no element is focused', async () => {
      await usingAsync(createInjector(), async (i) => {
        const btn = createButton('first', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(btn)

        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should focus first element in first section when no element is focused', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section = document.createElement('div')
        section.setAttribute('data-nav-section', 'main')
        const btn = createButton('first', { left: 0, top: 0, width: 50, height: 50 })
        section.append(btn)
        document.body.append(section)

        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should be a no-op when there are no focusable elements', async () => {
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(document.activeElement).toBe(document.body)
      })
    })
  })

  describe('keydown event handling', () => {
    it('Should move focus on arrow key press', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(right)
      })
    })

    it('Should activate focused element on Enter', async () => {
      await usingAsync(createInjector(), async (i) => {
        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        const clickHandler = vi.fn()
        btn.addEventListener('click', clickHandler)
        document.body.append(btn)

        btn.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).toHaveBeenCalledTimes(1)
      })
    })

    it('Should not handle events when disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()
        const s = i.get(SpatialNavigationService)
        s.enabled.setValue(false)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(left)
      })
    })

    it('Should skip events that are already defaultPrevented', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()
        i.get(SpatialNavigationService)

        const preventer = (ev: Event) => ev.preventDefault()
        window.addEventListener('keydown', preventer, { capture: true })

        try {
          pressKey('ArrowRight')
          expect(document.activeElement).toBe(left)
        } finally {
          window.removeEventListener('keydown', preventer, { capture: true })
        }
      })
    })
  })

  describe('input passthrough', () => {
    it('Should not intercept arrow keys on text input when cursor is mid-text', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = 'hello'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        input.setSelectionRange(2, 2)
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(input)
      })
    })

    it('Should escape text input with ArrowRight when cursor is at end', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = 'hello'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        input.setSelectionRange(5, 5)
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should escape text input with ArrowLeft when cursor is at start', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = 'hello'
        mockRect(input, { left: 100, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(btn, input)

        input.focus()
        input.setSelectionRange(0, 0)
        i.get(SpatialNavigationService)

        pressKey('ArrowLeft')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should not intercept arrow keys on textarea when cursor is mid-text', async () => {
      await usingAsync(createInjector(), async (i) => {
        const textarea = document.createElement('textarea')
        textarea.value = 'line1\nline2'
        mockRect(textarea, { left: 0, top: 0, width: 200, height: 100 })
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(textarea, btn)

        textarea.focus()
        textarea.setSelectionRange(3, 3)
        i.get(SpatialNavigationService)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(textarea)
      })
    })

    it('Should not intercept arrow keys on select', async () => {
      await usingAsync(createInjector(), async (i) => {
        const select = document.createElement('select')
        mockRect(select, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(select, btn)

        select.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(select)
      })
    })

    it('Should not intercept arrow keys on contenteditable', async () => {
      await usingAsync(createInjector(), async (i) => {
        const div = document.createElement('div')
        div.contentEditable = 'true'
        div.tabIndex = 0
        mockRect(div, { left: 0, top: 0, width: 200, height: 100 })
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(div, btn)

        div.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(div)
      })
    })

    it('Should not intercept arrow keys on children of contenteditable', async () => {
      await usingAsync(createInjector(), async (i) => {
        const div = document.createElement('div')
        div.contentEditable = 'true'
        div.tabIndex = 0
        mockRect(div, { left: 0, top: 0, width: 200, height: 100 })

        const span = document.createElement('span')
        span.tabIndex = 0
        span.scrollIntoView = vi.fn()
        mockRect(span, { left: 10, top: 10, width: 50, height: 20 })
        div.append(span)

        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(div, btn)

        span.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(span)
      })
    })

    it('Should not intercept Enter on children of contenteditable', async () => {
      await usingAsync(createInjector(), async (i) => {
        const div = document.createElement('div')
        div.contentEditable = 'true'
        div.tabIndex = 0
        mockRect(div, { left: 0, top: 0, width: 200, height: 100 })

        const span = document.createElement('span')
        span.tabIndex = 0
        mockRect(span, { left: 10, top: 10, width: 50, height: 20 })
        div.append(span)

        const clickHandler = vi.fn()
        span.addEventListener('click', clickHandler)
        document.body.append(div)

        span.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).not.toHaveBeenCalled()
      })
    })

    it('Should intercept arrow keys on button-type input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'button'
        mockRect(input, { left: 0, top: 0, width: 50, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should not intercept Left/Right on range input (slider adjustment)', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'range'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowLeft')
        expect(document.activeElement).toBe(input)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(input)
      })
    })

    it('Should intercept Up/Down on range input for spatial navigation', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'range'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should intercept arrow keys on color input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'color'
        mockRect(input, { left: 0, top: 0, width: 50, height: 50 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should intercept arrow keys on file input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'file'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should not intercept arrow keys on radio input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.name = 'group'
        mockRect(radio, { left: 0, top: 0, width: 20, height: 20 })
        const btn = createButton('btn', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(radio, btn)

        radio.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(radio)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(radio)
      })
    })

    it('Should not intercept Up/Down on number input (increment/decrement)', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'number'
        input.value = '5'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowUp')
        expect(document.activeElement).toBe(input)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(input)
      })
    })

    it('Should intercept Left/Right on number input for spatial navigation', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'number'
        input.value = '5'
        mockRect(input, { left: 100, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btnLeft = createButton('btn-left', { left: 0, top: 0, width: 50, height: 30 })
        const btnRight = createButton('btn-right', { left: 400, top: 0, width: 50, height: 30 })
        document.body.append(btnLeft, input, btnRight)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btnRight)
      })
    })

    it('Should not intercept arrow keys on date input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'date'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(input)

        pressKey('ArrowUp')
        expect(document.activeElement).toBe(input)
      })
    })

    it('Should not intercept arrow keys on time input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'time'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowDown')
        expect(document.activeElement).toBe(input)

        pressKey('ArrowLeft')
        expect(document.activeElement).toBe(input)
      })
    })

    it('Should escape empty text input on any arrow key', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        input.scrollIntoView = vi.fn()
        const btn = createButton('btn', { left: 300, top: 0, width: 50, height: 50 })
        document.body.append(input, btn)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(btn)
      })
    })

    it('Should not intercept Enter on text input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        const clickHandler = vi.fn()
        input.addEventListener('click', clickHandler)
        document.body.append(input)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).not.toHaveBeenCalled()
      })
    })

    it('Should not intercept Enter on textarea', async () => {
      await usingAsync(createInjector(), async (i) => {
        const textarea = document.createElement('textarea')
        textarea.value = 'hello'
        mockRect(textarea, { left: 0, top: 0, width: 200, height: 100 })
        const clickHandler = vi.fn()
        textarea.addEventListener('click', clickHandler)
        document.body.append(textarea)

        textarea.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).not.toHaveBeenCalled()
      })
    })

    it('Should activate Enter on button-type input', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'button'
        mockRect(input, { left: 0, top: 0, width: 50, height: 30 })
        const clickHandler = vi.fn()
        input.addEventListener('click', clickHandler)
        document.body.append(input)

        input.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('data-spatial-nav-passthrough', () => {
    it('Should not intercept arrow keys inside a passthrough container', async () => {
      await usingAsync(createInjector(), async (i) => {
        const container = document.createElement('div')
        container.setAttribute('data-spatial-nav-passthrough', '')
        const inner = document.createElement('input')
        inner.type = 'button'
        mockRect(inner, { left: 0, top: 0, width: 50, height: 30 })
        container.append(inner)

        const btn = createButton('btn', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(container, btn)

        inner.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(inner)
      })
    })

    it('Should not intercept Enter inside a passthrough container', async () => {
      await usingAsync(createInjector(), async (i) => {
        const container = document.createElement('div')
        container.setAttribute('data-spatial-nav-passthrough', '')
        const inner = createButton('inner', { left: 0, top: 0, width: 50, height: 50 })
        const clickHandler = vi.fn()
        inner.addEventListener('click', clickHandler)
        container.append(inner)
        document.body.append(container)

        inner.focus()
        i.get(SpatialNavigationService)

        pressKey('Enter')
        expect(clickHandler).not.toHaveBeenCalled()
      })
    })

    it('Should still intercept keys outside a passthrough container', async () => {
      await usingAsync(createInjector(), async (i) => {
        const container = document.createElement('div')
        container.setAttribute('data-spatial-nav-passthrough', '')
        const inner = document.createElement('input')
        inner.type = 'button'
        mockRect(inner, { left: 200, top: 0, width: 50, height: 30 })
        container.append(inner)

        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right, container)

        left.focus()
        i.get(SpatialNavigationService)

        pressKey('ArrowRight')
        expect(document.activeElement).toBe(right)
      })
    })
  })

  describe('section navigation', () => {
    it('Should scope navigation within the active section', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'sidebar')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1 = createButton('sidebar-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'main')
        mockRect(section2, { left: 250, top: 0, width: 500, height: 400 })
        const btn2 = createButton('main-btn1', { left: 260, top: 10, width: 50, height: 50 })
        const btn3 = createButton('main-btn2', { left: 260, top: 100, width: 50, height: 50 })
        section2.append(btn2, btn3)

        document.body.append(section1, section2)

        btn2.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(document.activeElement).toBe(btn3)
      })
    })

    it('Should update activeSection when focus moves', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section = document.createElement('div')
        section.setAttribute('data-nav-section', 'main')
        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        section.append(btn)
        document.body.append(section)

        btn.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('down')
        expect(s.activeSection.getValue()).toBe('main')
      })
    })
  })

  describe('cross-section navigation', () => {
    it('Should navigate to adjacent section when no candidate in current section', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'left')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1 = createButton('left-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'right')
        mockRect(section2, { left: 250, top: 0, width: 200, height: 400 })
        const btn2 = createButton('right-btn', { left: 260, top: 10, width: 50, height: 50 })
        btn2.scrollIntoView = vi.fn()
        section2.append(btn2)

        document.body.append(section1, section2)

        btn1.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(btn2)
        expect(s.activeSection.getValue()).toBe('right')
      })
    })

    it('Should not navigate cross-section when disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { crossSectionNavigation: false })

        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'left')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1 = createButton('left-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'right')
        mockRect(section2, { left: 250, top: 0, width: 200, height: 400 })
        const btn2 = createButton('right-btn', { left: 260, top: 10, width: 50, height: 50 })
        section2.append(btn2)

        document.body.append(section1, section2)

        btn1.focus()

        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(btn1)
      })
    })
  })

  describe('focus memory', () => {
    it('Should remember and restore focus when returning to a section', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'left')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1a = createButton('left-btn-a', { left: 10, top: 10, width: 50, height: 50 })
        const btn1b = createButton('left-btn-b', { left: 10, top: 100, width: 50, height: 50 })
        section1.append(btn1a, btn1b)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'right')
        mockRect(section2, { left: 250, top: 0, width: 200, height: 400 })
        const btn2 = createButton('right-btn', { left: 260, top: 100, width: 50, height: 50 })
        btn2.scrollIntoView = vi.fn()
        section2.append(btn2)

        document.body.append(section1, section2)

        btn1b.focus()

        const s = i.get(SpatialNavigationService)

        // Navigate away from section1
        s.moveFocus('right')
        expect(document.activeElement).toBe(btn2)

        // Navigate back to section1 - should restore focus to btn1b
        btn1b.scrollIntoView = vi.fn()
        s.moveFocus('left')
        expect(document.activeElement).toBe(btn1b)
      })
    })

    it('Should fall back to nearest element when remembered element is removed', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'left')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1 = createButton('left-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'right')
        mockRect(section2, { left: 250, top: 0, width: 200, height: 400 })
        const btn2a = createButton('right-btn-a', { left: 260, top: 10, width: 50, height: 50 })
        btn2a.scrollIntoView = vi.fn()
        const btn2b = createButton('right-btn-b', { left: 260, top: 100, width: 50, height: 50 })
        btn2b.scrollIntoView = vi.fn()
        section2.append(btn2a, btn2b)

        document.body.append(section1, section2)

        // Focus btn2a, navigate to section1
        btn2a.focus()
        const s = i.get(SpatialNavigationService)
        s.moveFocus('left')

        // Remove btn2a from DOM
        btn2a.remove()

        // Navigate back - should focus btn2b (nearest remaining)
        s.moveFocus('right')
        expect(document.activeElement).toBe(btn2b)
      })
    })

    it('Should fall back to nearest element when remembered element becomes disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'left')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const btn1 = createButton('left-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'right')
        mockRect(section2, { left: 250, top: 0, width: 200, height: 400 })
        const btn2a = createButton('right-btn-a', { left: 260, top: 10, width: 50, height: 50 })
        btn2a.scrollIntoView = vi.fn()
        const btn2b = createButton('right-btn-b', { left: 260, top: 100, width: 50, height: 50 })
        btn2b.scrollIntoView = vi.fn()
        section2.append(btn2a, btn2b)

        document.body.append(section1, section2)

        btn2a.focus()
        const s = i.get(SpatialNavigationService)
        s.moveFocus('left')

        // Disable btn2a after navigating away
        btn2a.disabled = true

        // Navigate back - should skip disabled btn2a and focus btn2b
        s.moveFocus('right')
        expect(document.activeElement).toBe(btn2b)
      })
    })
  })

  describe('enabled toggle', () => {
    it('Should stop handling keys when disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
        const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
        document.body.append(left, right)

        left.focus()
        const s = i.get(SpatialNavigationService)

        s.enabled.setValue(false)
        pressKey('ArrowRight')
        expect(document.activeElement).toBe(left)

        s.enabled.setValue(true)
        pressKey('ArrowRight')
        expect(document.activeElement).toBe(right)
      })
    })
  })

  describe('disposal', () => {
    it('Should remove keydown listener on dispose', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      await usingAsync(createInjector(), async (i) => {
        i.get(SpatialNavigationService)
      })

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('Should not handle events after disposal', async () => {
      const left = createButton('left', { left: 0, top: 0, width: 50, height: 50 })
      const right = createButton('right', { left: 100, top: 0, width: 50, height: 50 })
      document.body.append(left, right)

      left.focus()

      await usingAsync(createInjector(), async (i) => {
        i.get(SpatialNavigationService)
      })

      pressKey('ArrowRight')
      expect(document.activeElement).toBe(left)
    })
  })

  describe('backspace and escape', () => {
    it('Should call history.back() on Backspace when configured', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { backspaceGoesBack: true })

        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(btn)
        btn.focus()

        const backSpy = vi.spyOn(history, 'back').mockImplementation(() => {})
        i.get(SpatialNavigationService)

        pressKey('Backspace')
        expect(backSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('Should not call history.back() on Backspace by default', async () => {
      await usingAsync(createInjector(), async (i) => {
        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(btn)
        btn.focus()

        const backSpy = vi.spyOn(history, 'back').mockImplementation(() => {})
        i.get(SpatialNavigationService)

        pressKey('Backspace')
        expect(backSpy).not.toHaveBeenCalled()
      })
    })

    it('Should not call history.back() on Backspace when focused on a text input', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { backspaceGoesBack: true })

        const input = document.createElement('input')
        input.type = 'text'
        input.value = 'hello'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)
        input.focus()

        const backSpy = vi.spyOn(history, 'back').mockImplementation(() => {})
        i.get(SpatialNavigationService)

        pressKey('Backspace')
        expect(backSpy).not.toHaveBeenCalled()
      })
    })

    it('Should not call history.back() on Backspace when focused on a textarea', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { backspaceGoesBack: true })

        const textarea = document.createElement('textarea')
        textarea.value = 'some text'
        mockRect(textarea, { left: 0, top: 0, width: 200, height: 100 })
        document.body.append(textarea)
        textarea.focus()

        const backSpy = vi.spyOn(history, 'back').mockImplementation(() => {})
        i.get(SpatialNavigationService)

        pressKey('Backspace')
        expect(backSpy).not.toHaveBeenCalled()
      })
    })

    it('Should move to parent section on Escape when configured', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { escapeGoesToParentSection: true })

        const outer = document.createElement('div')
        outer.setAttribute('data-nav-section', 'outer')
        const outerBtn = createButton('outer-btn', { left: 10, top: 10, width: 50, height: 50 })

        const inner = document.createElement('div')
        inner.setAttribute('data-nav-section', 'inner')
        const innerBtn = createButton('inner-btn', { left: 10, top: 200, width: 50, height: 50 })
        inner.append(innerBtn)

        outer.append(outerBtn, inner)
        document.body.append(outer)

        innerBtn.focus()
        i.get(SpatialNavigationService)

        pressKey('Escape')
        expect(document.activeElement).toBe(outerBtn)
      })
    })

    it('Should blur a range input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'range'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)

        input.focus()
        expect(document.activeElement).toBe(input)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a radio input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.name = 'group'
        mockRect(radio, { left: 0, top: 0, width: 20, height: 20 })
        document.body.append(radio)

        radio.focus()
        expect(document.activeElement).toBe(radio)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a date input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'date'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)

        input.focus()
        expect(document.activeElement).toBe(input)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a time input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'time'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)

        input.focus()
        expect(document.activeElement).toBe(input)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a number input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'number'
        input.value = '5'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)

        input.focus()
        expect(document.activeElement).toBe(input)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a text input on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = 'hello'
        mockRect(input, { left: 0, top: 0, width: 200, height: 30 })
        document.body.append(input)

        input.focus()
        expect(document.activeElement).toBe(input)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should blur a textarea on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const textarea = document.createElement('textarea')
        textarea.value = 'hello'
        mockRect(textarea, { left: 0, top: 0, width: 200, height: 100 })
        document.body.append(textarea)

        textarea.focus()
        expect(document.activeElement).toBe(textarea)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(document.body)
      })
    })

    it('Should not blur a button on Escape', async () => {
      await usingAsync(createInjector(), async (i) => {
        const btn = createButton('btn', { left: 0, top: 0, width: 50, height: 50 })
        document.body.append(btn)

        btn.focus()
        expect(document.activeElement).toBe(btn)

        i.get(SpatialNavigationService)
        pressKey('Escape')
        expect(document.activeElement).toBe(btn)
      })
    })
  })

  describe('data-spatial-nav-target', () => {
    it('Should treat elements with data-spatial-nav-target as focusable candidates', async () => {
      await usingAsync(createInjector(), async (i) => {
        const origin = createButton('origin', { left: 0, top: 0, width: 50, height: 50 })
        const target = document.createElement('div')
        target.setAttribute('data-spatial-nav-target', '')
        target.tabIndex = -1
        target.id = 'nav-target'
        mockRect(target, { left: 100, top: 0, width: 50, height: 50 })
        target.scrollIntoView = vi.fn()

        document.body.append(origin, target)

        origin.focus()
        const s = i.get(SpatialNavigationService)
        s.moveFocus('right')
        expect(document.activeElement).toBe(target)
      })
    })
  })

  describe('overflow-aware visibility', () => {
    it('Should skip candidates whose center is outside their overflow container', async () => {
      await usingAsync(createInjector(), async (i) => {
        const container = document.createElement('div')
        Object.defineProperty(container, 'computedStyleMap', { value: () => new Map() })
        vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
          if (el === container) {
            return { overflow: 'hidden', overflowX: 'hidden', overflowY: 'visible' } as CSSStyleDeclaration
          }
          return { overflow: 'visible', overflowX: 'visible', overflowY: 'visible' } as CSSStyleDeclaration
        })
        mockRect(container, { left: 0, top: 0, width: 200, height: 50 })

        const visible = createButton('visible', { left: 10, top: 10, width: 50, height: 30 })
        const hidden = createButton('hidden', { left: 300, top: 10, width: 50, height: 30 })
        container.append(visible, hidden)

        const origin = createButton('origin', { left: 0, top: 100, width: 50, height: 50 })
        document.body.append(container, origin)

        origin.focus()
        const s = i.get(SpatialNavigationService)
        s.moveFocus('up')
        expect(document.activeElement).toBe(visible)
      })
    })
  })

  describe('focus trap', () => {
    it('Should block cross-section navigation when a trap is active', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'modal')
        mockRect(section1, { left: 0, top: 0, width: 400, height: 400 })
        const btn1 = createButton('modal-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(btn1)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'background')
        mockRect(section2, { left: 500, top: 0, width: 200, height: 400 })
        const btn2 = createButton('bg-btn', { left: 510, top: 10, width: 50, height: 50 })
        section2.append(btn2)

        document.body.append(section1, section2)

        btn1.focus()

        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('modal')

        s.moveFocus('right')
        expect(document.activeElement).toBe(btn1)
      })
    })

    it('Should set activeSection when pushing a trap', async () => {
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('dialog')
        expect(s.activeSection.getValue()).toBe('dialog')
      })
    })

    it('Should restore previous section on pop', async () => {
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        s.activeSection.setValue('main')
        s.pushFocusTrap('dialog')
        expect(s.activeSection.getValue()).toBe('dialog')

        s.popFocusTrap('dialog', 'main')
        expect(s.activeSection.getValue()).toBe('main')
      })
    })

    it('Should support nested traps — topmost wins', async () => {
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('outer-dialog')
        s.pushFocusTrap('inner-dialog')
        expect(s.activeSection.getValue()).toBe('inner-dialog')

        s.popFocusTrap('inner-dialog')
        expect(s.activeSection.getValue()).toBe('outer-dialog')

        s.popFocusTrap('outer-dialog', 'main')
        expect(s.activeSection.getValue()).toBe('main')
      })
    })

    it('Should allow within-section navigation when trap is active', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section = document.createElement('div')
        section.setAttribute('data-nav-section', 'modal')
        mockRect(section, { left: 0, top: 0, width: 400, height: 400 })
        const btn1 = createButton('btn1', { left: 10, top: 10, width: 50, height: 50 })
        const btn2 = createButton('btn2', { left: 10, top: 100, width: 50, height: 50 })
        section.append(btn1, btn2)
        document.body.append(section)

        btn1.focus()

        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('modal')

        s.moveFocus('down')
        expect(document.activeElement).toBe(btn2)
      })
    })

    it('Should focus within trapped section when activeElement is document.body', async () => {
      await usingAsync(createInjector(), async (i) => {
        const section1 = document.createElement('div')
        section1.setAttribute('data-nav-section', 'sidebar')
        mockRect(section1, { left: 0, top: 0, width: 200, height: 400 })
        const sidebarBtn = createButton('sidebar-btn', { left: 10, top: 10, width: 50, height: 50 })
        section1.append(sidebarBtn)

        const section2 = document.createElement('div')
        section2.setAttribute('data-nav-section', 'modal')
        mockRect(section2, { left: 300, top: 50, width: 400, height: 300 })
        const modalBtn = createButton('modal-btn', { left: 310, top: 60, width: 50, height: 50 })
        section2.append(modalBtn)

        document.body.append(section1, section2)

        // Focus is on body (simulates element removed from DOM during wizard step transition)
        ;(document.activeElement as HTMLElement)?.blur()
        expect(document.activeElement).toBe(document.body)

        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('modal')

        s.moveFocus('down')
        expect(document.activeElement).toBe(modalBtn)
        expect(s.activeSection.getValue()).toBe('modal')
      })
    })

    it('Should clear trap stack on disposal', async () => {
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        s.pushFocusTrap('dialog')
      })
      // After disposal, creating a new instance should have no traps
      await usingAsync(createInjector(), async (i) => {
        const s = i.get(SpatialNavigationService)
        expect(s.activeSection.getValue()).toBeNull()
      })
    })
  })

  describe('configureSpatialNavigation', () => {
    it('Should configure the service with custom options', async () => {
      await usingAsync(createInjector(), async (i) => {
        configureSpatialNavigation(i, { initiallyEnabled: false })
        const s = i.get(SpatialNavigationService)
        expect(s.enabled.getValue()).toBe(false)
      })
    })

    it('Should rebind options when called after the service is instantiated', async () => {
      await usingAsync(createInjector(), async (i) => {
        const first = i.get(SpatialNavigationService)
        expect(first.enabled.getValue()).toBe(true)

        configureSpatialNavigation(i, { initiallyEnabled: false })

        const second = i.get(SpatialNavigationService)
        expect(second).not.toBe(first)
        expect(second.enabled.getValue()).toBe(false)
      })
    })
  })
})
