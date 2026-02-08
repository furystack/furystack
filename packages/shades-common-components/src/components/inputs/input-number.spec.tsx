import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InputNumber } from './input-number.js'

describe('InputNumber', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <InputNumber />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-input-number')
      expect(el).not.toBeNull()
    })
  })

  it('should render the inner input, decrement and increment buttons', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <InputNumber value={5} />,
      })

      await sleepAsync(50)

      const wrapper = document.querySelector('shade-input-number') as HTMLElement
      const input = wrapper.querySelector('input') as HTMLInputElement
      const buttons = wrapper.querySelectorAll('.step-button')

      expect(input).not.toBeNull()
      expect(input.value).toBe('5')
      expect(buttons.length).toBe(2)
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <InputNumber labelTitle="Quantity" />,
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-input-number label') as HTMLLabelElement
      expect(label).not.toBeNull()
      expect(label.textContent).toContain('Quantity')
    })
  })

  describe('increment and decrement', () => {
    it('should increment value when + button is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(6)
      })
    })

    it('should decrement value when - button is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const decrementBtn = wrapper.querySelectorAll('.step-button')[0] as HTMLButtonElement
        decrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(4)
      })
    })

    it('should use custom step value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={10} step={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(15)
      })
    })
  })

  describe('min and max', () => {
    it('should clamp value to max', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={9} max={10} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(10)
      })
    })

    it('should clamp value to min', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={1} min={0} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const decrementBtn = wrapper.querySelectorAll('.step-button')[0] as HTMLButtonElement
        decrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(0)
      })
    })

    it('should disable decrement button when value equals min', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={0} min={0} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const decrementBtn = wrapper.querySelectorAll('.step-button')[0] as HTMLButtonElement

        expect(decrementBtn.disabled).toBe(true)
      })
    })

    it('should disable increment button when value equals max', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={100} max={100} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement

        expect(incrementBtn.disabled).toBe(true)
      })
    })
  })

  describe('precision', () => {
    it('should display value with specified precision', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={3.1} precision={2} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        expect(input.value).toBe('3.10')
      })
    })

    it('should round to precision when stepping', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={1} step={0.01} precision={2} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(1.01)
      })
    })
  })

  describe('keyboard support', () => {
    it('should increment on ArrowUp', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(6)
      })
    })

    it('should decrement on ArrowDown', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(4)
      })
    })

    it('should not respond to keyboard when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} disabled onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('formatter and parser', () => {
    it('should display formatted value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={1000} formatter={(v) => (v !== undefined ? `$${v.toLocaleString()}` : '')} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        expect(input.value).toBe('$1,000')
      })
    })

    it('should use parser to interpret input text', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <InputNumber
              value={0}
              parser={(text) => {
                const cleaned = text.replace(/[^0-9.-]/g, '')
                const num = Number(cleaned)
                return isNaN(num) ? undefined : num
              }}
              onValueChange={onValueChange}
            />
          ),
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        input.value = '$500'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(500)
      })
    })
  })

  describe('direct text input', () => {
    it('should parse typed value on blur', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={0} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        input.value = '42'
        input.dispatchEvent(new Event('blur', { bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(42)
      })
    })

    it('should handle empty input on blur', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        input.value = ''
        input.dispatchEvent(new Event('blur', { bubbles: true }))

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('disabled state', () => {
    it('should set data-disabled attribute when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber disabled />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-input-number') as HTMLElement
        expect(el.hasAttribute('data-disabled')).toBe(true)
      })
    })

    it('should disable both step buttons when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} disabled />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const buttons = wrapper.querySelectorAll('.step-button')

        expect((buttons[0] as HTMLButtonElement).disabled).toBe(true)
        expect((buttons[1] as HTMLButtonElement).disabled).toBe(true)
      })
    })

    it('should not change value when clicking buttons while disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} disabled onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('variants', () => {
    it('should set data-variant for outlined', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber variant="outlined" />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-input-number') as HTMLElement
        expect(el.getAttribute('data-variant')).toBe('outlined')
      })
    })

    it('should set data-variant for contained', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber variant="contained" />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-input-number') as HTMLElement
        expect(el.getAttribute('data-variant')).toBe('contained')
      })
    })
  })

  describe('helper text', () => {
    it('should render helper text', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber helperText="Enter a quantity" />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const helperText = wrapper.querySelector('.helperText') as HTMLElement

        expect(helperText).not.toBeNull()
        expect(helperText.textContent).toBe('Enter a quantity')
      })
    })

    it('should not render helper text container when no helper text', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const helperText = wrapper.querySelector('.helperText')

        expect(helperText).toBeNull()
      })
    })
  })

  describe('accessibility', () => {
    it('should set role=spinbutton on the input', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber value={5} min={0} max={10} />,
        })

        // Wait for render + requestAnimationFrame
        await sleepAsync(100)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const input = wrapper.querySelector('input') as HTMLInputElement

        expect(input.getAttribute('role')).toBe('spinbutton')
        expect(input.getAttribute('aria-valuemin')).toBe('0')
        expect(input.getAttribute('aria-valuemax')).toBe('10')
        expect(input.getAttribute('aria-valuenow')).toBe('5')
      })
    })

    it('should set aria-label on step buttons', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber />,
        })

        // Wait for render + requestAnimationFrame
        await sleepAsync(100)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const buttons = wrapper.querySelectorAll('.step-button')

        expect(buttons[0].getAttribute('aria-label')).toBe('Decrease value')
        expect(buttons[1].getAttribute('aria-label')).toBe('Increase value')
      })
    })
  })

  describe('no initial value', () => {
    it('should start from min when incrementing with no value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber min={1} onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(2)
      })
    })

    it('should start from 0 when incrementing with no value and no min', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <InputNumber onValueChange={onValueChange} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-input-number') as HTMLElement
        const incrementBtn = wrapper.querySelectorAll('.step-button')[1] as HTMLButtonElement
        incrementBtn.click()

        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith(1)
      })
    })
  })
})
