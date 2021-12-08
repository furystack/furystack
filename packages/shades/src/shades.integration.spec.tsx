import { Injector } from '@furystack/inject'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { JSDOM } from 'jsdom'
import { initializeShadeRoot } from './initialize'
import { Shade } from './shade'
import { createComponent } from './shade-component'

describe('Shades integration tests', () => {
  const oldDoc = document

  beforeAll(() => {
    globalThis.document = new JSDOM().window.document
  })

  afterAll(() => {
    globalThis.document = oldDoc
  })

  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Should mount a custom component to a Shade root', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({ render: () => <div>Hello</div>, shadowDomName: 'shades-example' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe('<div id="root"><shades-example><div>Hello</div></shades-example></div>')
  })

  it('Should mount nested Shades components', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({
      render: ({ children }) => <div>{children}</div>,
      shadowDomName: 'shades-example-2',
    })

    const ExampleSubs = Shade<{ no: number }>({
      render: ({ props }) => <div>{props.no}</div>,
      shadowDomName: 'shades-example-sub',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <ExampleComponent>
          <ExampleSubs no={1} />
          <ExampleSubs no={2} />
          <ExampleSubs no={3} />
        </ExampleComponent>
      ),
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-example-2><div><shades-example-sub><div></div></shades-example-sub><shades-example-sub><div></div></shades-example-sub><shades-example-sub><div></div></shades-example-sub></div></shades-example-2></div>',
    )
  })

  it("Should execute the constructed and constructed's cleanup callback", () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const cleanup = jest.fn()
    const constructed = jest.fn(() => cleanup)

    const ExampleComponent = Shade({
      constructed,
      render: () => <div>Hello</div>,
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(constructed).toBeCalled()
    expect(cleanup).not.toBeCalled()
    document.body.innerHTML = ''
    expect(cleanup).toBeCalled()
  })

  it('Should execute the onAttach and onDetach callbacks', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const onAttach = jest.fn()
    const onDetach = jest.fn()

    const ExampleComponent = Shade({
      onAttach,
      onDetach,
      render: () => <div>Hello</div>,
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(onAttach).toBeCalled()
    expect(onDetach).not.toBeCalled()
    document.body.innerHTML = ''
    expect(onDetach).toBeCalled()
  })

  it('Should update state', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({
      getInitialState: () => ({ count: 0 }),
      render: ({ getState, updateState }) => {
        const { count } = getState()
        return (
          <div>
            Count is {getState().count.toString()}
            <button id="plus" onclick={() => updateState({ count: count + 1 })}>
              +
            </button>
            <button id="minus" onclick={() => updateState({ count: count - 1 })}>
              -
            </button>
          </div>
        )
      },
    })
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })

    const plus = () => document.getElementById('plus')?.click()
    const minus = () => document.getElementById('minus')?.click()

    expect(document.body.innerHTML).toContain('Count is 0')
    plus()
    expect(document.body.innerHTML).toContain('Count is 1')
    plus()
    expect(document.body.innerHTML).toContain('Count is 2')

    minus()
    minus()
    expect(document.body.innerHTML).toContain('Count is 0')
  })
})
