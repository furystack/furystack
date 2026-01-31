import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, using } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Form, FormService } from './form.js'

describe('FormService', () => {
  describe('initialization', () => {
    it('should initialize with null validatedFormData', () => {
      using(new FormService(), (service) => {
        expect(service.validatedFormData.getValue()).toBeNull()
      })
    })

    it('should initialize with null rawFormData', () => {
      using(new FormService(), (service) => {
        expect(service.rawFormData.getValue()).toBeNull()
      })
    })

    it('should initialize with unknown validation result', () => {
      using(new FormService(), (service) => {
        expect(service.validationResult.getValue()).toEqual({ isValid: null })
      })
    })

    it('should initialize with empty fieldErrors', () => {
      using(new FormService(), (service) => {
        expect(service.fieldErrors.getValue()).toEqual({})
      })
    })

    it('should initialize with empty inputs set', () => {
      using(new FormService(), (service) => {
        expect(service.inputs.size).toBe(0)
      })
    })
  })

  describe('setFieldState', () => {
    it('should update field errors with valid result', () => {
      using(new FormService<{ email: string }>(), (service) => {
        const validity = { valid: true } as ValidityState

        service.setFieldState('email', { isValid: true }, validity)

        expect(service.fieldErrors.getValue()).toEqual({
          email: { validationResult: { isValid: true }, validity },
        })
      })
    })

    it('should update field errors with invalid result', () => {
      using(new FormService<{ email: string }>(), (service) => {
        const validity = { valid: false, valueMissing: true } as ValidityState
        const validationResult = { isValid: false as const, message: 'Email is required' }

        service.setFieldState('email', validationResult, validity)

        expect(service.fieldErrors.getValue()).toEqual({
          email: { validationResult, validity },
        })
      })
    })

    it('should merge field errors when updating multiple fields', () => {
      using(new FormService<{ email: string; password: string }>(), (service) => {
        const validity = { valid: true } as ValidityState

        service.setFieldState('email', { isValid: true }, validity)
        service.setFieldState('password', { isValid: true }, validity)

        const errors = service.fieldErrors.getValue()
        expect(errors.email).toBeDefined()
        expect(errors.password).toBeDefined()
      })
    })
  })

  describe('disposal', () => {
    it('should dispose all observables', () => {
      const service = new FormService()

      const validatedFormDataDisposeSpy = vi.spyOn(service.validatedFormData, Symbol.dispose)
      const rawFormDataDisposeSpy = vi.spyOn(service.rawFormData, Symbol.dispose)
      const validationResultDisposeSpy = vi.spyOn(service.validationResult, Symbol.dispose)

      service[Symbol.dispose]()

      expect(validatedFormDataDisposeSpy).toHaveBeenCalled()
      expect(rawFormDataDisposeSpy).toHaveBeenCalled()
      expect(validationResultDisposeSpy).toHaveBeenCalled()
    })
  })
})

describe('Form component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render children', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { name: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={() => {}} validate={(data): data is FormData => typeof data.name === 'string'}>
          <input name="name" type="text" />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]')
    expect(form).not.toBeNull()
    expect(form?.querySelector('input[name="name"]')).not.toBeNull()
    expect(form?.querySelector('button[type="submit"]')).not.toBeNull()
  })

  it('should call onSubmit with validated data when form is valid', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const onSubmit = vi.fn()

    type FormData = { name: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={onSubmit} validate={(data): data is FormData => typeof data.name === 'string'}>
          <input name="name" type="text" value="Test Name" />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="name"]') as HTMLInputElement
    input.value = 'Test Name'

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submitEvent)

    await sleepAsync(50)

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Test Name' })
  })

  it('should not call onSubmit when validation fails', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const onSubmit = vi.fn()

    type FormData = { name: string; email: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData>
          onSubmit={onSubmit}
          validate={(data): data is FormData => {
            return typeof data.name === 'string' && typeof data.email === 'string' && data.email.includes('@')
          }}
        >
          <input name="name" type="text" />
          <input name="email" type="text" />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement
    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement

    nameInput.value = 'Test'
    emailInput.value = 'invalid-email'

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submitEvent)

    await sleepAsync(50)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should set validation result to validation-failed when validate returns false', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { email: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData>
          onSubmit={() => {}}
          validate={(data): data is FormData => {
            return data.email?.includes('@') ?? false
          }}
        >
          <input name="email" type="text" />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="email"]') as HTMLInputElement
    input.value = 'no-at-sign'

    const changeEvent = new Event('change', { bubbles: true })
    form.dispatchEvent(changeEvent)

    await sleepAsync(50)

    const formInjector = (form as unknown as { injector: Injector }).injector
    const formService = formInjector.getInstance(FormService)

    expect(formService.validationResult.getValue()).toEqual({
      isValid: false,
      reason: 'validation-failed',
    })
  })

  it('should reset form state on reset event', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const onReset = vi.fn()

    type FormData = { name: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData>
          onSubmit={() => {}}
          onReset={onReset}
          validate={(data): data is FormData => typeof data.name === 'string'}
        >
          <input name="name" type="text" />
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="name"]') as HTMLInputElement
    input.value = 'Test'

    const changeEvent = new Event('change', { bubbles: true })
    form.dispatchEvent(changeEvent)

    await sleepAsync(50)

    const formInjector = (form as unknown as { injector: Injector }).injector
    const formService = formInjector.getInstance(FormService)

    expect(formService.rawFormData.getValue()).toEqual({ name: 'Test' })

    const resetEvent = new Event('reset', { bubbles: true })
    form.dispatchEvent(resetEvent)

    await sleepAsync(50)

    expect(formService.rawFormData.getValue()).toBeNull()
    expect(formService.validationResult.getValue()).toEqual({ isValid: null })
    expect(formService.validatedFormData.getValue()).toBeNull()
  })

  it('should update rawFormData on change event', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { username: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={() => {}} validate={(data): data is FormData => typeof data.username === 'string'}>
          <input name="username" type="text" />
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="username"]') as HTMLInputElement
    input.value = 'testuser'

    const changeEvent = new Event('change', { bubbles: true })
    form.dispatchEvent(changeEvent)

    await sleepAsync(50)

    const formInjector = (form as unknown as { injector: Injector }).injector
    const formService = formInjector.getInstance(FormService)

    expect(formService.rawFormData.getValue()).toEqual({ username: 'testuser' })
  })

  it('should set validatedFormData when validation passes', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { title: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={() => {}} validate={(data): data is FormData => typeof data.title === 'string'}>
          <input name="title" type="text" />
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="title"]') as HTMLInputElement
    input.value = 'My Title'

    const changeEvent = new Event('change', { bubbles: true })
    form.dispatchEvent(changeEvent)

    await sleepAsync(50)

    const formInjector = (form as unknown as { injector: Injector }).injector
    const formService = formInjector.getInstance(FormService)

    expect(formService.validatedFormData.getValue()).toEqual({ title: 'My Title' })
    expect(formService.validationResult.getValue()).toEqual({ isValid: true })
  })

  it('should prevent default on submit event', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { field: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={() => {}} validate={(_data): _data is FormData => true}>
          <input name="field" type="text" />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should create child injector with FormService', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { data: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData> onSubmit={() => {}} validate={(_data): _data is FormData => true}>
          <input name="data" type="text" />
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const formInjector = (form as unknown as { injector: Injector }).injector

    expect(formInjector).toBeInstanceOf(Injector)
    expect(formInjector).not.toBe(injector)

    const formService = formInjector.getInstance(FormService)
    expect(formService).toBeInstanceOf(FormService)
  })

  it('should handle oninvalid event and trigger validation', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    type FormData = { required: string }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Form<FormData>
          onSubmit={() => {}}
          validate={(data): data is FormData => typeof data.required === 'string' && data.required.length > 0}
        >
          <input name="required" type="text" required />
          <button type="submit">Submit</button>
        </Form>
      ),
    })

    await sleepAsync(50)

    const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
    const input = form.querySelector('input[name="required"]') as HTMLInputElement

    const invalidEvent = new Event('invalid', { bubbles: true })
    input.dispatchEvent(invalidEvent)

    await sleepAsync(50)
  })
})
