import { Injector } from '@furystack/inject'
import { ObservableValue, sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { Shade } from './shade.js'

describe('Shade Resources integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should update the component based on a custom observable value change', async () => {
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

    await sleepAsync(10) // Cleanup can be async

    expect(obs1.getObservers().length).toBe(0)
    expect(obs2.getObservers().length).toBe(0)

    expect(renderCounter).toBeCalledTimes(3)
  })

  it('Should NOT re-render the component when a custom onChange callback is provided', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const renderCounter = vi.fn()
    const customOnChange = vi.fn()

    const obs = new ObservableValue(0)

    const ExampleComponent = Shade({
      render: ({ useObservable }) => {
        const [value] = useObservable('obs', obs, { onChange: customOnChange })

        renderCounter()
        return <div id="val">{value}</div>
      },
      shadowDomName: 'shades-example-custom-onchange',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })

    const element = document.querySelector('shades-example-custom-onchange') as JSX.Element

    // Initial render
    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)
    expect(customOnChange).toBeCalledTimes(0) // Not called until value changes
    expect(document.getElementById('val')?.textContent).toBe('0')

    // Change the observable value
    obs.setValue(1)

    // Custom onChange should be called
    expect(customOnChange).toBeCalledTimes(1)
    expect(customOnChange).toHaveBeenLastCalledWith(1)

    // But component should NOT re-render
    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)

    // DOM should still show old value since no re-render occurred
    expect(document.getElementById('val')?.textContent).toBe('0')

    // Change again to verify consistent behavior
    obs.setValue(2)

    expect(customOnChange).toBeCalledTimes(2)
    expect(customOnChange).toHaveBeenLastCalledWith(2)
    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)
  })

  it('Should allow manual DOM updates in custom onChange callback without re-render', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const renderCounter = vi.fn()
    const obs = new ObservableValue(0)

    const ExampleComponent = Shade({
      render: ({ useObservable, element }) => {
        useObservable('obs', obs, {
          onChange: (newValue) => {
            // Manually update the DOM without triggering a re-render
            const valueElement = element.querySelector('#manual-val')
            if (valueElement) {
              valueElement.textContent = String(newValue)
            }
          },
        })

        renderCounter()
        return <div id="manual-val">{obs.getValue()}</div>
      },
      shadowDomName: 'shades-example-manual-dom-update',
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ExampleComponent />,
    })

    const element = document.querySelector('shades-example-manual-dom-update') as JSX.Element

    // Initial render
    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)
    expect(document.getElementById('manual-val')?.textContent).toBe('0')

    // Change the observable value
    obs.setValue(42)

    // Component should NOT re-render
    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)

    // But DOM should be updated via the manual onChange callback
    expect(document.getElementById('manual-val')?.textContent).toBe('42')

    // Change again
    obs.setValue(100)

    expect(element.getRenderCount()).toBe(1)
    expect(renderCounter).toBeCalledTimes(1)
    expect(document.getElementById('manual-val')?.textContent).toBe('100')
  })
})
