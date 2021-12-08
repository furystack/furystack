import { Injector } from '@furystack/inject'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { JSDOM } from 'jsdom'
import { initializeShadeRoot } from './initialize'
import { Shade } from './shade'
import { createComponent } from './shade-component'
import { ObservableValue } from '@furystack/utils'

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

  it('Should update the component based on a custom observable value change', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const obs1 = new ObservableValue(0)
    const obs2 = new ObservableValue('a')

    const ExampleComponent = Shade({
      resources: () => [obs1.subscribe(() => undefined), obs2.subscribe(() => undefined)],
      render: () => {
        return <div>example</div>
      },
      shadowDomName: 'shades-example',
    })

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })
    expect(document.body.innerHTML).toBe('<div id="root"><shades-example><div>example</div></shades-example></div>')

    expect(obs1.getObservers().length).toBe(1)
    expect(obs2.getObservers().length).toBe(1)

    obs1.setValue(1)
    expect(document.body.innerHTML).toBe('<div id="root"><shades-example><div>example</div></shades-example></div>')

    obs2.setValue('b')
    expect(document.body.innerHTML).toBe('<div id="root"><shades-example><div>example</div></shades-example></div>')

    document.body.innerHTML = ''

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)
  })
})
