import { Injector } from '@furystack/inject'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { flushUpdates, Shade } from './shade.js'

describe('Shade Resources integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should update the component based on a custom observable value change', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-example-resource><div><div id="val1">0</div><div id="val2">a</div></div></shades-example-resource></div>',
      )

      expect(obs1.getObservers().length).toBe(1)
      expect(obs2.getObservers().length).toBe(1)

      expect(renderCounter).toBeCalledTimes(1)

      obs1.setValue(1)
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-example-resource><div><div id="val1">1</div><div id="val2">a</div></div></shades-example-resource></div>',
      )
      expect(renderCounter).toBeCalledTimes(2)

      obs2.setValue('b')
      await flushUpdates()
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
  })

  it('Should NOT re-render the component when a custom onChange callback is provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()

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
  })

  it('Should allow manual DOM updates in custom onChange callback without re-render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const renderCounter = vi.fn()
      const obs = new ObservableValue(0)

      const ExampleComponent = Shade({
        render: ({ useObservable, useRef }) => {
          const valRef = useRef<HTMLDivElement>('manualVal')
          useObservable('obs', obs, {
            onChange: (newValue) => {
              if (valRef.current) {
                valRef.current.textContent = String(newValue)
              }
            },
          })

          renderCounter()
          return (
            <div ref={valRef} id="manual-val">
              {obs.getValue()}
            </div>
          )
        },
        shadowDomName: 'shades-example-manual-dom-update',
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

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

  it('Should batch multiple synchronous observable changes into a single render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const renderCounter = vi.fn()

      const obs1 = new ObservableValue(0)
      const obs2 = new ObservableValue('a')
      const obs3 = new ObservableValue(false)

      const ExampleComponent = Shade({
        render: ({ useObservable }) => {
          const [value1] = useObservable('obs1', obs1)
          const [value2] = useObservable('obs2', obs2)
          const [value3] = useObservable('obs3', obs3)

          renderCounter()
          return (
            <div>
              <span id="v1">{value1}</span>
              <span id="v2">{value2}</span>
              <span id="v3">{String(value3)}</span>
            </div>
          )
        },
        shadowDomName: 'shades-example-batching',
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const element = document.querySelector('shades-example-batching') as JSX.Element

      expect(element.getRenderCount()).toBe(1)
      expect(renderCounter).toBeCalledTimes(1)

      // Change all three observables synchronously without awaiting in between
      obs1.setValue(42)
      obs2.setValue('z')
      obs3.setValue(true)

      // Before flushing, the DOM should still reflect the old values
      expect(element.getRenderCount()).toBe(1)

      await flushUpdates()

      // After flushing, all changes should be reflected in a single render
      expect(element.getRenderCount()).toBe(2)
      expect(renderCounter).toBeCalledTimes(2)
      expect(document.getElementById('v1')?.textContent).toBe('42')
      expect(document.getElementById('v2')?.textContent).toBe('z')
      expect(document.getElementById('v3')?.textContent).toBe('true')
    })
  })

  it('Should batch multiple updateComponent() calls into a single render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const renderCounter = vi.fn()

      const ExampleComponent = Shade({
        render: () => {
          renderCounter()
          return <div>content</div>
        },
        shadowDomName: 'shades-example-update-batching',
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const element = document.querySelector('shades-example-update-batching') as JSX.Element

      expect(element.getRenderCount()).toBe(1)
      expect(renderCounter).toBeCalledTimes(1)

      // Call updateComponent multiple times synchronously
      element.updateComponent()
      element.updateComponent()
      element.updateComponent()

      // Before flushing, render count should still be 1
      expect(element.getRenderCount()).toBe(1)

      await flushUpdates()

      // After flushing, only a single additional render should have occurred
      expect(element.getRenderCount()).toBe(2)
      expect(renderCounter).toBeCalledTimes(2)
    })
  })
})
