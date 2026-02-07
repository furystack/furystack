import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { Form, FormService } from '../form.js'
import { Switch } from './switch.js'

describe('Switch', () => {
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
        jsxElement: <Switch />,
      })

      await sleepAsync(50)

      const switchEl = document.querySelector('shade-switch')
      expect(switchEl).not.toBeNull()
    })
  })

  it('should render the hidden checkbox input', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Switch name="testSwitch" />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.name).toBe('testSwitch')
      expect(input.getAttribute('role')).toBe('switch')
    })
  })

  it('should render the switch track and thumb', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Switch />,
      })

      await sleepAsync(50)

      const track = document.querySelector('shade-switch .switch-track')
      const thumb = document.querySelector('shade-switch .switch-thumb')
      expect(track).not.toBeNull()
      expect(thumb).not.toBeNull()
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Switch labelTitle="Enable notifications" />,
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-switch label') as HTMLLabelElement
      expect(label).not.toBeNull()
      expect(label.textContent).toContain('Enable notifications')
    })
  })

  it('should not render label span when labelTitle is not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Switch />,
      })

      await sleepAsync(50)

      const labelSpan = document.querySelector('shade-switch .switch-label')
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
          jsxElement: <Switch checked />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
        expect(input.checked).toBe(true)
      })
    })

    it('should render as unchecked when checked prop is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch checked={false} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
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
          jsxElement: <Switch disabled />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        expect(switchEl.hasAttribute('data-disabled')).toBe(true)
      })
    })

    it('should not have data-disabled attribute when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch disabled={false} />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        expect(switchEl.hasAttribute('data-disabled')).toBe(false)
      })
    })

    it('should set the disabled attribute on the input element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch disabled />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
        expect(input.disabled).toBe(true)
      })
    })
  })

  describe('size', () => {
    it('should set data-size="small" when size is small', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch size="small" />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        expect(switchEl.getAttribute('data-size')).toBe('small')
      })
    })

    it('should not have data-size attribute when size is medium (default)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch size="medium" />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        expect(switchEl.hasAttribute('data-size')).toBe(false)
      })
    })
  })

  describe('callbacks', () => {
    it('should call onchange when switch is toggled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch name="toggle" onchange={onchange} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalled()
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
          jsxElement: <Switch />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(switchEl.style.getPropertyValue('--switch-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch color="secondary" />,
        })

        await sleepAsync(50)

        const switchEl = document.querySelector('shade-switch') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(switchEl.style.getPropertyValue('--switch-color')).toBe(themeService.theme.palette.secondary.main)
      })
    })
  })

  describe('FormService integration', () => {
    it('should register input with FormService when inside a Form', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { notifications: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Switch name="notifications" labelTitle="Enable notifications" />
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

        type TestFormData = { notifications: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Switch name="notifications" labelTitle="Enable notifications" />
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

  describe('labelProps', () => {
    it('should pass labelProps to the label element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch labelProps={{ className: 'custom-label' }} />,
        })

        await sleepAsync(50)

        const label = document.querySelector('shade-switch label') as HTMLLabelElement
        expect(label.className).toContain('custom-label')
      })
    })
  })

  describe('required', () => {
    it('should set the required attribute on the input element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch required />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
        expect(input.required).toBe(true)
      })
    })
  })

  describe('value', () => {
    it('should set the value attribute on the input element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Switch value="yes" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-switch input[type="checkbox"]') as HTMLInputElement
        expect(input.value).toBe('yes')
      })
    })
  })
})
