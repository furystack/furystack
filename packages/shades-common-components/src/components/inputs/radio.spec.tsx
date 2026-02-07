import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { Form, FormService } from '../form.js'
import { Radio } from './radio.js'

describe('Radio', () => {
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
        jsxElement: <Radio value="option1" />,
      })

      await sleepAsync(50)

      const radio = document.querySelector('shade-radio')
      expect(radio).not.toBeNull()
    })
  })

  it('should render the inner radio input element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Radio value="option1" name="test-group" />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shade-radio input[type="radio"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.value).toBe('option1')
      expect(input.name).toBe('test-group')
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Radio value="option1" labelTitle="Option 1" />,
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-radio label') as HTMLLabelElement
      expect(label).not.toBeNull()
      expect(label.textContent).toContain('Option 1')
    })
  })

  it('should not render label span when labelTitle is not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Radio value="option1" />,
      })

      await sleepAsync(50)

      const labelSpan = document.querySelector('shade-radio .radio-label')
      expect(labelSpan).toBeNull()
    })
  })

  describe('checked state', () => {
    it('should render as checked when checked prop is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" checked />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-radio input[type="radio"]') as HTMLInputElement
        expect(input.checked).toBe(true)
      })
    })

    it('should render as unchecked when checked prop is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" checked={false} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-radio input[type="radio"]') as HTMLInputElement
        expect(input.checked).toBe(false)
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
          jsxElement: <Radio value="option1" disabled />,
        })

        await sleepAsync(50)

        const radio = document.querySelector('shade-radio') as HTMLElement
        expect(radio.hasAttribute('data-disabled')).toBe(true)

        const input = radio.querySelector('input[type="radio"]') as HTMLInputElement
        expect(input.disabled).toBe(true)
      })
    })

    it('should not have data-disabled attribute when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" disabled={false} />,
        })

        await sleepAsync(50)

        const radio = document.querySelector('shade-radio') as HTMLElement
        expect(radio.hasAttribute('data-disabled')).toBe(false)
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variable from theme', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" />,
        })

        await sleepAsync(50)

        const radio = document.querySelector('shade-radio') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(radio.style.getPropertyValue('--radio-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" color="secondary" />,
        })

        await sleepAsync(50)

        const radio = document.querySelector('shade-radio') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(radio.style.getPropertyValue('--radio-color')).toBe(themeService.theme.palette.secondary.main)
      })
    })
  })

  describe('callbacks', () => {
    it('should call onchange when radio is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" name="test" onchange={onchange} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-radio input[type="radio"]') as HTMLInputElement
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalled()
      })
    })
  })

  describe('FormService integration', () => {
    it('should register input with FormService when inside a Form', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { choice: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Radio value="option1" name="choice" labelTitle="Option 1" />
            </Form>
          ),
        })

        await sleepAsync(50)

        const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
        const formInjector = (form as unknown as { injector: Injector }).injector
        const formService = formInjector.getInstance(FormService)

        expect(formService.inputs.size).toBe(1)
      })
    })
  })

  describe('labelProps', () => {
    it('should pass labelProps to the label element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Radio value="option1" labelProps={{ className: 'custom-label' }} />,
        })

        await sleepAsync(50)

        const label = document.querySelector('shade-radio label') as HTMLLabelElement
        expect(label.className).toContain('custom-label')
      })
    })
  })
})
