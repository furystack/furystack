import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { Form, FormService } from '../form.js'
import { Checkbox } from './checkbox.js'

describe('Checkbox', () => {
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
        jsxElement: <Checkbox />,
      })

      await sleepAsync(50)

      const checkbox = document.querySelector('shade-checkbox')
      expect(checkbox).not.toBeNull()
    })
  })

  it('should render the inner checkbox input element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Checkbox name="testField" />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.name).toBe('testField')
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Checkbox labelTitle="Accept terms" />,
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-checkbox label') as HTMLLabelElement
      expect(label).not.toBeNull()
      expect(label.textContent).toContain('Accept terms')
    })
  })

  it('should not render label span when no labelTitle is provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Checkbox />,
      })

      await sleepAsync(50)

      const labelSpan = document.querySelector('shade-checkbox .checkbox-label')
      expect(labelSpan).toBeNull()
    })
  })

  describe('checked state', () => {
    it('should be checked when checked prop is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox checked />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
        expect(input.checked).toBe(true)
      })
    })

    it('should not be checked when checked prop is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox checked={false} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
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
          jsxElement: <Checkbox disabled />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(true)

        const input = wrapper.querySelector('input[type="checkbox"]') as HTMLInputElement
        expect(input.disabled).toBe(true)
      })
    })

    it('should not have data-disabled attribute when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox disabled={false} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(false)
      })
    })
  })

  describe('indeterminate state', () => {
    it('should set data-indeterminate attribute when indeterminate', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox indeterminate />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        expect(wrapper.hasAttribute('data-indeterminate')).toBe(true)
      })
    })

    it('should not have data-indeterminate attribute when not indeterminate', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox indeterminate={false} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        expect(wrapper.hasAttribute('data-indeterminate')).toBe(false)
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
          jsxElement: <Checkbox />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--checkbox-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox color="secondary" />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-checkbox') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--checkbox-color')).toBe(themeService.theme.palette.secondary.main)
      })
    })
  })

  describe('callbacks', () => {
    it('should call onchange when checkbox is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox onchange={onchange} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalled()
      })
    })
  })

  describe('value and name', () => {
    it('should set value attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox name="terms" value="accepted" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
        expect(input.value).toBe('accepted')
        expect(input.name).toBe('terms')
      })
    })
  })

  describe('required', () => {
    it('should set required attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Checkbox required />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-checkbox input[type="checkbox"]') as HTMLInputElement
        expect(input.required).toBe(true)
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
          jsxElement: <Checkbox labelProps={{ className: 'custom-label' }} />,
        })

        await sleepAsync(50)

        const label = document.querySelector('shade-checkbox label') as HTMLLabelElement
        expect(label.className).toContain('custom-label')
      })
    })
  })

  describe('FormService integration', () => {
    it('should register input with FormService when inside a Form', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { agree: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Checkbox name="agree" labelTitle="I agree" />
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

    it('should unregister input from FormService on cleanup', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { agree: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Checkbox name="agree" labelTitle="I agree" />
            </Form>
          ),
        })

        await sleepAsync(50)

        const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
        const formInjector = (form as unknown as { injector: Injector }).injector
        const formService = formInjector.getInstance(FormService)

        expect(formService.inputs.size).toBe(1)

        rootElement.innerHTML = ''

        await sleepAsync(50)
      })
    })
  })
})
