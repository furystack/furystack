import { Injector } from '@furystack/inject'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { JSDOM } from 'jsdom'
import { initializeShadeRoot } from './initialize'
import { Shade } from './shade'
import { createComponent } from './shade-component'
import { ObservableValue } from '@furystack/utils'

describe('Shade Resources integration tests', () => {
  const oldDoc = document

  beforeAll(() => {
    globalThis.document = new JSDOM().window.document
  })

  afterAll(() => {
    globalThis.document = oldDoc
  })

  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Should update the component based on a custom observable value change', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const renderCounter = jest.fn()

    const obs1 = new ObservableValue(0)
    const obs2 = new ObservableValue('a')

    const ExampleComponent = Shade({
      resources: ({ element }) => [
        obs1.subscribe(
          (val1) => ((element.querySelector('#val1') as HTMLDivElement).innerHTML = val1.toString()),
          true,
        ),
        obs2.subscribe(
          (val2) => ((element.querySelector('#val2') as HTMLDivElement).innerHTML = val2.toString()),
          true,
        ),
      ],
      render: () => {
        renderCounter()
        return (
          <div>
            <div id="val1"></div>
            <div id="val2"></div>
          </div>
        )
      },
      shadowDomName: 'shades-example-resource',
    })

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-example-resource><div><div id="val1">0</div><div id="val2">a</div></div></shades-example-resource></div>',
    )

    expect(obs1.getObservers().length).toBe(1)
    expect(obs2.getObservers().length).toBe(1)

    expect(renderCounter).toBeCalledTimes(1)

    obs1.setValue(1)
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-example-resource><div><div id="val1">1</div><div id="val2">a</div></div></shades-example-resource></div>',
    )

    obs2.setValue('b')
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-example-resource><div><div id="val1">1</div><div id="val2">b</div></div></shades-example-resource></div>',
    )

    document.body.innerHTML = ''

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)

    expect(renderCounter).toBeCalledTimes(1)
  })
})