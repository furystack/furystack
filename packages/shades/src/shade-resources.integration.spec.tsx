import { Injector } from '@furystack/inject'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { initializeShadeRoot } from './initialize.js'
import { Shade } from './shade.js'
import { createComponent } from './shade-component.js'
import { ObservableValue } from '@furystack/utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

describe('Shade Resources integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should update the component based on a custom observable value change', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const renderCounter = vi.fn()

    const obs1 = new ObservableValue(0)
    const obs2 = new ObservableValue('a')

    const ExampleComponent = Shade({
      render: ({ useObservable }) => {
        const [value1] = useObservable('obs1', obs1)
        const [value2] = useObservable('obs2', obs2)

        renderCounter()
        return (
          <div>
            <div id="val1">{value1}</div>
            <div id="val2">{value2}</div>
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
    expect(renderCounter).toBeCalledTimes(2)

    obs2.setValue('b')
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shades-example-resource><div><div id="val1">1</div><div id="val2">b</div></div></shades-example-resource></div>',
    )

    const element = document.querySelector('shades-example-resource') as JSX.Element
    expect(element.getRenderCount()).toBe(3)

    document.body.innerHTML = ''

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)

    expect(renderCounter).toBeCalledTimes(3)
  })
})
