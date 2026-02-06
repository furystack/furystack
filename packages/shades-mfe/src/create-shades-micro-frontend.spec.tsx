import { Injector } from '@furystack/inject'
import { createComponent, Shade } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateMicroFrontendService } from './create-microfrontend-service.js'
import { createShadesMicroFrontend } from './create-shades-micro-frontend.js'

describe('createShadesMicroFrontend', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should return a CreateMicroFrontendService instance', () => {
    const TestComponent = Shade<{ value: string }>({
      shadowDomName: 'test-mfe-return-type',
      render: ({ props }) => <div>{props.value}</div>,
    })

    const result = createShadesMicroFrontend(TestComponent)

    expect(result).toBeInstanceOf(CreateMicroFrontendService)
    expect(result.create).toBeTypeOf('function')
    expect(result.destroy).toBeUndefined()
  })

  it('should create a child injector when create is called', async () => {
    const TestComponent = Shade<{ value: string }>({
      shadowDomName: 'test-mfe-child-injector',
      render: ({ props }) => <div>{props.value}</div>,
    })

    await usingAsync(new Injector(), async (parentInjector) => {
      const createChildSpy = vi.spyOn(parentInjector, 'createChild')

      const mfeService = createShadesMicroFrontend(TestComponent)
      const rootElement = document.getElementById('root') as HTMLDivElement

      mfeService.create({
        api: { value: 'test' },
        rootElement,
        injector: parentInjector,
      })

      expect(createChildSpy).toHaveBeenCalledWith({
        owner: createShadesMicroFrontend,
      })
    })
  })

  it('should render the component with the provided API props', async () => {
    const testValue = crypto.randomUUID()

    const TestComponent = Shade<{ value: string }>({
      shadowDomName: 'test-mfe-render-props',
      render: ({ props }) => <div data-testid="content">Value: {props.value}</div>,
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const mfeService = createShadesMicroFrontend(TestComponent)
      mfeService.create({
        api: { value: testValue },
        rootElement,
        injector,
      })

      await sleepAsync(10)

      expect(rootElement.innerHTML).toContain(`Value: ${testValue}`)
    })
  })

  it('should render the component into the provided root element', async () => {
    const TestComponent = Shade<object>({
      shadowDomName: 'test-mfe-root-element',
      render: () => <span>MFE Content</span>,
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const mfeService = createShadesMicroFrontend(TestComponent)
      mfeService.create({
        api: {},
        rootElement,
        injector,
      })

      await sleepAsync(10)

      expect(rootElement.querySelector('test-mfe-root-element')).toBeTruthy()
      expect(rootElement.innerHTML).toContain('MFE Content')
    })
  })

  it('should work with complex API types', async () => {
    type ComplexApi = {
      user: { id: string; name: string }
      onClick: () => void
      items: string[]
    }

    const clickHandler = vi.fn()

    const TestComponent = Shade<ComplexApi>({
      shadowDomName: 'test-mfe-complex-api',
      render: ({ props }) => (
        <div>
          <span data-testid="user-name">{props.user.name}</span>
          <span data-testid="item-count">{props.items.length}</span>
          <button onclick={props.onClick}>Click</button>
        </div>
      ),
    })

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const mfeService = createShadesMicroFrontend(TestComponent)
      mfeService.create({
        api: {
          user: { id: '123', name: 'John Doe' },
          onClick: clickHandler,
          items: ['a', 'b', 'c'],
        },
        rootElement,
        injector,
      })

      await sleepAsync(10)

      expect(rootElement.innerHTML).toContain('John Doe')
      expect(rootElement.innerHTML).toContain('3')

      const button = rootElement.querySelector('button')
      button?.click()

      expect(clickHandler).toHaveBeenCalled()
    })
  })

  it('should use the child injector for the shade root', async () => {
    let capturedInjector: Injector | undefined

    const TestComponent = Shade<object>({
      shadowDomName: 'test-mfe-injector-capture',
      render: ({ injector }) => {
        capturedInjector = injector
        return <div>Test</div>
      },
    })

    await usingAsync(new Injector(), async (parentInjector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const mfeService = createShadesMicroFrontend(TestComponent)
      mfeService.create({
        api: {},
        rootElement,
        injector: parentInjector,
      })

      await sleepAsync(10)

      expect(capturedInjector).toBeDefined()
      // The component should receive a child injector, not the parent
      expect(capturedInjector).not.toBe(parentInjector)
    })
  })
})
