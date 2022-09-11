import { Injector } from '@furystack/inject'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { initializeShadeRoot } from './initialize'
import { Shade } from './shade'
import { createComponent, createFragment } from './shade-component'

describe('Shades integration tests', () => {
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

  it('Should mount a custom component with a string render result', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({ render: () => 'Hello', shadowDomName: 'shades-string-render-result' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-string-render-result>Hello</shades-string-render-result></div>',
    )
  })

  it('Should mount a custom component with null render result', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({ render: () => null, shadowDomName: 'shades-null-render-result' })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe('<div id="root"><shades-null-render-result></shades-null-render-result></div>')
  })

  it('Should mount a custom component with a document fragment render result', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({
      render: () => (
        <>
          <p>1</p>
          <p>2</p>
        </>
      ),
      shadowDomName: 'shades-fragment-render-result',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-fragment-render-result><p>1</p><p>2</p></shades-fragment-render-result></div>',
    )
  })

  it('Should mount a custom component with a nested document fragment render result', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const ExampleComponent = Shade({
      render: () => (
        <p>
          <>
            <p>1</p>
            <p>2</p>
          </>
        </p>
      ),
      shadowDomName: 'shades-fragment-render-result-nested',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-fragment-render-result-nested><p><p>1</p><p>2</p></p></shades-fragment-render-result-nested></div>',
    )
  })

  it('Should mount a custom component with a document fragment that contains custom components', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const CustomComponent = Shade({
      shadowDomName: 'shades-fragment-test-custom-component',
      render: () => <p>Hello</p>,
    })

    const ExampleComponent = Shade({
      render: () => (
        <>
          <CustomComponent />
          <CustomComponent />
        </>
      ),
      shadowDomName: 'shades-fragment-render-result-2',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-fragment-render-result-2><shades-fragment-test-custom-component><p>Hello</p></shades-fragment-test-custom-component><shades-fragment-test-custom-component><p>Hello</p></shades-fragment-test-custom-component></shades-fragment-render-result-2></div>',
    )
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
      shadowDomName: 'example-component-1',
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
      shadowDomName: 'example-component-2',
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
      shadowDomName: 'example-component-3',
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
    const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)

    expectCount(0)
    plus()
    expectCount(1)
    plus()
    expectCount(2)

    minus()
    minus()
    expectCount(0)
  })

  it('Should allow children update after unmount and remount', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const Parent = Shade<unknown, { areChildrenVisible: boolean }>({
      shadowDomName: 'shade-remount-parent',
      getInitialState: () => ({ areChildrenVisible: true }),
      render: ({ children, getState, updateState }) => (
        <div>
          <button
            id="showHideChildren"
            onclick={() => {
              updateState({ areChildrenVisible: !getState().areChildrenVisible })
            }}
          >
            Toggle
          </button>
          {getState().areChildrenVisible ? children : <div />}
        </div>
      ),
    })

    const Child = Shade({
      shadowDomName: 'example-remount-child',
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
      jsxElement: (
        <Parent>
          <Child />
        </Parent>
      ),
    })

    const plus = () => document.getElementById('plus')?.click()
    const minus = () => document.getElementById('minus')?.click()
    const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)
    const toggleChildren = () => document.getElementById('showHideChildren')?.click()

    expectCount(0)
    plus()
    expectCount(1)

    toggleChildren()

    expect(document.getElementById('plus')).toBeNull()

    toggleChildren()
    expect(document.getElementById('plus')).toBeDefined()

    // expectCount(0)
    plus()
    expectCount(1)
    minus()
    expectCount(0)
  })
})
