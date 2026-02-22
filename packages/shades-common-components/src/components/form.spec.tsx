import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { using, usingAsync } from '@furystack/utils'
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

    it('should initialize isSubmitting as false', () => {
      using(new FormService(), (service) => {
        expect(service.isSubmitting.getValue()).toBe(false)
      })
    })

    it('should initialize submitError as undefined', () => {
      using(new FormService(), (service) => {
        expect(service.submitError.getValue()).toBeUndefined()
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
      const fieldErrorsDisposeSpy = vi.spyOn(service.fieldErrors, Symbol.dispose)
      const isSubmittingDisposeSpy = vi.spyOn(service.isSubmitting, Symbol.dispose)
      const submitErrorDisposeSpy = vi.spyOn(service.submitError, Symbol.dispose)

      service[Symbol.dispose]()

      expect(validatedFormDataDisposeSpy).toHaveBeenCalled()
      expect(rawFormDataDisposeSpy).toHaveBeenCalled()
      expect(validationResultDisposeSpy).toHaveBeenCalled()
      expect(fieldErrorsDisposeSpy).toHaveBeenCalled()
      expect(isSubmittingDisposeSpy).toHaveBeenCalled()
      expect(submitErrorDisposeSpy).toHaveBeenCalled()
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
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => {}}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]')
      expect(form).not.toBeNull()
      expect(form?.querySelector('input[name="name"]')).not.toBeNull()
      expect(form?.querySelector('button[type="submit"]')).not.toBeNull()
    })
  })

  it('should call onSubmit with validated data when form is valid', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSubmit = vi.fn()

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={onSubmit}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" value="Test Name" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test Name'

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()

      expect(onSubmit).toHaveBeenCalledWith({ name: 'Test Name' })
    })
  })

  it('should not call onSubmit when validation fails', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
              const d = data as Record<string, unknown>
              return typeof d.name === 'string' && typeof d.email === 'string' && d.email.includes('@')
            }}
          >
            <input name="name" type="text" />
            <input name="email" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement
      const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement

      nameInput.value = 'Test'
      emailInput.value = 'invalid-email'

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  it('should set validation result to validation-failed when validate returns false', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { email: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => {}}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.email === 'string' && d.email.includes('@')
            }}
          >
            <input name="email" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="email"]') as HTMLInputElement
      input.value = 'no-at-sign'

      const changeEvent = new Event('change', { bubbles: true })
      form.dispatchEvent(changeEvent)

      await flushUpdates()

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      expect(formService.validationResult.getValue()).toEqual({
        isValid: false,
        reason: 'validation-failed',
      })
    })
  })

  it('should reset form state on reset event', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
            <button type="reset">Reset</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const changeEvent = new Event('change', { bubbles: true })
      form.dispatchEvent(changeEvent)

      await flushUpdates()

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      expect(formService.rawFormData.getValue()).toEqual({ name: 'Test' })

      const resetEvent = new Event('reset', { bubbles: true })
      form.dispatchEvent(resetEvent)

      await flushUpdates()

      expect(formService.rawFormData.getValue()).toBeNull()
      expect(formService.validationResult.getValue()).toEqual({ isValid: null })
      expect(formService.validatedFormData.getValue()).toBeNull()
    })
  })

  it('should update rawFormData on change event', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { username: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => {}}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.username === 'string'
            }}
          >
            <input name="username" type="text" />
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="username"]') as HTMLInputElement
      input.value = 'testuser'

      const changeEvent = new Event('change', { bubbles: true })
      form.dispatchEvent(changeEvent)

      await flushUpdates()

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      expect(formService.rawFormData.getValue()).toEqual({ username: 'testuser' })
    })
  })

  it('should set validatedFormData when validation passes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { title: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => {}}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.title === 'string'
            }}
          >
            <input name="title" type="text" />
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="title"]') as HTMLInputElement
      input.value = 'My Title'

      const changeEvent = new Event('change', { bubbles: true })
      form.dispatchEvent(changeEvent)

      await flushUpdates()

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      expect(formService.validatedFormData.getValue()).toEqual({ title: 'My Title' })
      expect(formService.validationResult.getValue()).toEqual({ isValid: true })
    })
  })

  it('should prevent default on submit event', async () => {
    await usingAsync(new Injector(), async (injector) => {
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

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

      form.dispatchEvent(submitEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  it('should create child injector with FormService', async () => {
    await usingAsync(new Injector(), async (injector) => {
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

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const formInjector = (form as unknown as { injector: Injector }).injector

      expect(formInjector).toBeInstanceOf(Injector)
      expect(formInjector).not.toBe(injector)

      const formService = formInjector.getInstance(FormService)
      expect(formService).toBeInstanceOf(FormService)
    })
  })

  it('should handle oninvalid event and trigger validation', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { required: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => {}}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.required === 'string' && d.required.length > 0
            }}
          >
            <input name="required" type="text" required />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="required"]') as HTMLInputElement

      const invalidEvent = new Event('invalid', { bubbles: true })
      input.dispatchEvent(invalidEvent)

      await flushUpdates()
    })
  })

  it('should set isSubmitting during async onSubmit and reset after', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => submitPromise}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      expect(formService.isSubmitting.getValue()).toBe(false)

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()
      expect(formService.isSubmitting.getValue()).toBe(true)

      resolveSubmit!()
      await flushUpdates()
      expect(formService.isSubmitting.getValue()).toBe(false)
    })
  })

  it('should reset isSubmitting to false and set submitError when onSubmit throws', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { name: string }

      const submitError = new Error('Submit failed')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={async () => {
              throw submitError
            }}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()
      expect(formService.isSubmitting.getValue()).toBe(false)
      expect(formService.submitError.getValue()).toBe(submitError)
    })
  })

  it('should clear submitError before a new submission', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let shouldThrow = true
      let resolveSubmit: () => void

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={async () => {
              if (shouldThrow) {
                throw new Error('First submit fails')
              }
              return new Promise<void>((resolve) => {
                resolveSubmit = resolve
              })
            }}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushUpdates()
      expect(formService.submitError.getValue()).toBeInstanceOf(Error)

      shouldThrow = false
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushUpdates()
      expect(formService.submitError.getValue()).toBeUndefined()
      expect(formService.isSubmitting.getValue()).toBe(true)

      resolveSubmit!()
      await flushUpdates()
      expect(formService.isSubmitting.getValue()).toBe(false)
    })
  })

  it('should set inert on form element when disableOnSubmit is true during async submit', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => submitPromise}
            disableOnSubmit
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      expect(form.inert).toBeFalsy()

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()
      expect(form.inert).toBe(true)

      resolveSubmit!()
      await flushUpdates()
      expect(form.inert).toBe(false)
    })
  })

  it('should not set inert when disableOnSubmit is not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={() => submitPromise}
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()
      expect(form.inert).toBeFalsy()

      resolveSubmit!()
      await flushUpdates()
    })
  })

  it('should remove inert even if onSubmit throws when disableOnSubmit is true', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      type FormData = { name: string }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form<FormData>
            onSubmit={async () => {
              throw new Error('Submit failed')
            }}
            disableOnSubmit
            validate={(data): data is FormData => {
              const d = data as Record<string, unknown>
              return typeof d.name === 'string'
            }}
          >
            <input name="name" type="text" />
            <button type="submit">Submit</button>
          </Form>
        ),
      })

      await flushUpdates()

      const form = document.querySelector('form[is="shade-form"]') as HTMLFormElement
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      input.value = 'Test'

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      await flushUpdates()
      expect(form.inert).toBe(false)
      const formInjector = (form as unknown as { injector: Injector }).injector
      const formService = formInjector.getInstance(FormService)
      expect(formService.isSubmitting.getValue()).toBe(false)
    })
  })
})
