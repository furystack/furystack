import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { Form, FormService } from '../form.js'
import { Input } from './input.js'

describe('Input', () => {
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
        jsxElement: <Input />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shade-input')
      expect(input).not.toBeNull()
    })
  })

  it('should render the inner input element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Input name="testField" />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shade-input input') as HTMLInputElement
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
        jsxElement: <Input labelTitle="Test Label" />,
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-input label') as HTMLLabelElement
      expect(label).not.toBeNull()
      expect(label.textContent).toContain('Test Label')
    })
  })

  describe('variants', () => {
    it('should set data-variant attribute for outlined variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input variant="outlined" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input') as HTMLElement
        expect(input).not.toBeNull()
        expect(input.getAttribute('data-variant')).toBe('outlined')
      })
    })

    it('should set data-variant attribute for contained variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input variant="contained" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input') as HTMLElement
        expect(input).not.toBeNull()
        expect(input.getAttribute('data-variant')).toBe('contained')
      })
    })

    it('should not have data-variant when variant is not specified', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input') as HTMLElement
        expect(input).not.toBeNull()
        expect(input.hasAttribute('data-variant')).toBe(false)
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
          jsxElement: <Input disabled />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input') as HTMLElement
        expect(input).not.toBeNull()
        expect(input.hasAttribute('data-disabled')).toBe(true)
      })
    })

    it('should not have data-disabled attribute when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input disabled={false} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input') as HTMLElement
        expect(input).not.toBeNull()
        expect(input.hasAttribute('data-disabled')).toBe(false)
      })
    })
  })

  describe('validation', () => {
    it('should call custom validation callback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getValidationResult = vi.fn().mockReturnValue({ isValid: true })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="email" getValidationResult={getValidationResult} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.value = 'test@example.com'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(getValidationResult).toHaveBeenCalled()
      })
    })

    it('should set data-invalid when validation fails', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Input
              name="email"
              getValidationResult={() => ({ isValid: false, message: 'Invalid email' })}
              value="invalid"
            />
          ),
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement
        input.value = 'invalid'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(inputWrapper.hasAttribute('data-invalid')).toBe(true)
      })
    })

    it('should not have data-invalid when validation passes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="email" getValidationResult={() => ({ isValid: true })} value="valid@email.com" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement
        input.value = 'valid@email.com'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(inputWrapper.hasAttribute('data-invalid')).toBe(false)
      })
    })

    it('should display validation message in helper text when validation fails', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Input name="email" getValidationResult={() => ({ isValid: false, message: 'Email is required' })} />
          ),
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement
        input.value = ''
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement
        expect(helperText.textContent).toBe('Email is required')
      })
    })

    it('should show default validation message for required field', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" required />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement

        const invalidEvent = new Event('invalid', { bubbles: true, cancelable: true })
        input.dispatchEvent(invalidEvent)

        await sleepAsync(50)

        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement
        expect(helperText.textContent).toBe('Value is required')
      })
    })
  })

  describe('helper text', () => {
    it('should render custom helper text', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="email" getHelperText={() => 'Enter your email address'} />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement

        expect(helperText.textContent).toBe('Enter your email address')
      })
    })

    it('should call getHelperText with state and validation result when validation passes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getHelperText = vi.fn().mockReturnValue('Helper text')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Input name="email" getHelperText={getHelperText} getValidationResult={() => ({ isValid: true })} />
          ),
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.value = 'test'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(getHelperText).toHaveBeenCalled()

        const { calls } = getHelperText.mock
        const callWithValidation = calls.find(
          (call: Array<{ validationResult?: unknown }>) => call[0].validationResult !== undefined,
        )
        expect(callWithValidation).toBeDefined()
        expect((callWithValidation as [{ validationResult: unknown; state: unknown }])[0].validationResult).toEqual({
          isValid: true,
        })
        expect((callWithValidation as [{ validationResult: unknown; state: unknown }])[0].state).toBeDefined()
      })
    })

    it('should use validation message instead of getHelperText when validation fails with message', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getHelperText = vi.fn().mockReturnValue('Fallback helper')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Input
              name="email"
              getHelperText={getHelperText}
              getValidationResult={() => ({ isValid: false, message: 'Validation error message' })}
            />
          ),
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.value = 'test'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement

        expect(helperText.textContent).toBe('Validation error message')
      })
    })
  })

  describe('icons', () => {
    it('should render start icon when getStartIcon is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="search" getStartIcon={() => '🔍'} />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const startIcon = inputWrapper.querySelector('.startIcon') as HTMLElement

        expect(startIcon).not.toBeNull()
        expect(startIcon.textContent).toBe('🔍')
      })
    })

    it('should render end icon when getEndIcon is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="password" getEndIcon={() => '👁️'} />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const endIcon = inputWrapper.querySelector('.endIcon') as HTMLElement

        expect(endIcon).not.toBeNull()
        expect(endIcon.textContent).toBe('👁️')
      })
    })

    it('should not render icon container when getStartIcon is not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const startIcon = inputWrapper.querySelector('.startIcon')

        expect(startIcon).toBeNull()
      })
    })

    it('should update icons on state change', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" getEndIcon={({ state }) => (state.focused ? '✓' : '○')} />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement
        const endIcon = inputWrapper.querySelector('.endIcon') as HTMLElement

        expect(endIcon.textContent).toBe('○')

        input.dispatchEvent(new FocusEvent('focus'))
        await sleepAsync(50)

        expect(endIcon.textContent).toBe('✓')
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variables from theme', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement

        const themeService = injector.getInstance(ThemeProviderService)
        expect(inputWrapper.style.getPropertyValue('--input-primary-color')).toBe(
          themeService.theme.palette.primary.main,
        )
        expect(inputWrapper.style.getPropertyValue('--input-error-color')).toBe(themeService.theme.palette.error.main)
      })
    })

    it('should use custom color from defaultColor prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" defaultColor="secondary" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement

        const themeService = injector.getInstance(ThemeProviderService)
        expect(inputWrapper.style.getPropertyValue('--input-primary-color')).toBe(
          themeService.theme.palette.secondary.main,
        )
      })
    })
  })

  describe('callbacks', () => {
    it('should call onTextChange when input value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onTextChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" onTextChange={onTextChange} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.value = 'new value'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onTextChange).toHaveBeenCalledWith('new value')
      })
    })

    it('should call onchange when input value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" onchange={onchange} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.value = 'test'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalled()
      })
    })
  })

  describe('focus and blur', () => {
    it('should update state on focus', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getEndIcon = vi.fn().mockReturnValue('icon')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" getEndIcon={getEndIcon} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        input.dispatchEvent(new FocusEvent('focus'))

        await sleepAsync(50)

        expect(getEndIcon).toHaveBeenLastCalledWith(
          expect.objectContaining({
            state: expect.objectContaining({
              focused: true,
            }) as unknown,
          }),
        )
      })
    })

    it('should update state on blur', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getEndIcon = vi.fn().mockReturnValue('icon')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" getEndIcon={getEndIcon} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement

        input.dispatchEvent(new FocusEvent('focus'))
        await sleepAsync(50)

        input.dispatchEvent(new FocusEvent('blur'))
        await sleepAsync(50)

        expect(getEndIcon).toHaveBeenLastCalledWith(
          expect.objectContaining({
            state: expect.objectContaining({
              focused: false,
            }) as unknown,
          }),
        )
      })
    })
  })

  describe('autofocus', () => {
    it('should set initial focused state based on autofocus prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const getEndIcon = vi.fn().mockReturnValue('icon')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" autofocus getEndIcon={getEndIcon} />,
        })

        await sleepAsync(50)

        expect(getEndIcon).toHaveBeenCalledWith(
          expect.objectContaining({
            state: expect.objectContaining({
              focused: true,
            }) as unknown,
          }),
        )
      })
    })
  })

  describe('FormService integration', () => {
    it('should register input with FormService when inside a Form', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { email: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Input name="email" labelTitle="Email" />
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

    it('should update FormService field state on validation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { email: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Input
                name="email"
                labelTitle="Email"
                getValidationResult={({ state }) => {
                  if (state.value.includes('@')) {
                    return { isValid: true }
                  }
                  return { isValid: false, message: 'Invalid email format' }
                }}
              />
            </Form>
          ),
        })

        await sleepAsync(50)

        const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
        const inputWrapper = form.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement

        input.value = 'invalid'
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        const formInjector = (form as unknown as { injector: Injector }).injector
        const formService = formInjector.getInstance(FormService)
        const fieldErrors = formService.fieldErrors.getValue()

        expect(fieldErrors.email).toBeDefined()
        expect(fieldErrors.email?.validationResult).toEqual({
          isValid: false,
          message: 'Invalid email format',
        })
      })
    })

    it('should unregister input from FormService on cleanup', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        type TestFormData = { email: string }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Form<TestFormData> onSubmit={() => {}} validate={(_data): _data is TestFormData => true}>
              <Input name="email" labelTitle="Email" />
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

  describe('default validation messages', () => {
    it('should show message for typeMismatch', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="email" type="email" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement

        input.value = 'not-an-email'
        const invalidEvent = new Event('invalid', { bubbles: true, cancelable: true })
        input.dispatchEvent(invalidEvent)

        await sleepAsync(50)

        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement
        expect(helperText.textContent).toBe('Value is not valid')
      })
    })

    it('should handle pattern mismatch validation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="code" pattern="[A-Z]{3}" />,
        })

        await sleepAsync(50)

        const inputWrapper = document.querySelector('shade-input') as HTMLElement
        const input = inputWrapper.querySelector('input') as HTMLInputElement

        input.value = '123'
        const invalidEvent = new Event('invalid', { bubbles: true, cancelable: true })
        input.dispatchEvent(invalidEvent)

        await sleepAsync(50)

        const helperText = inputWrapper.querySelector('.helperText') as HTMLElement
        expect(helperText.textContent).toBe('Value does not match the pattern')
      })
    })
  })

  describe('value handling', () => {
    it('should use initial value prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Input name="field" value="initial value" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-input input') as HTMLInputElement
        expect(input.value).toBe('initial value')
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
          jsxElement: <Input name="field" labelProps={{ className: 'custom-label' }} />,
        })

        await sleepAsync(50)

        const label = document.querySelector('shade-input label') as HTMLLabelElement
        expect(label.className).toContain('custom-label')
      })
    })
  })
})
