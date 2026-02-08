import { Injector } from '@furystack/inject'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { Shade } from './shade.js'

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('Rendering integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should preserve focus on re-render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        tagName: 'focus-preserve-test',
        render: ({ useState }) => {
          const [count, setCount] = useState('count', 0)
          return (
            <div>
              <input id="the-input" type="text" />
              <span id="count">{count}</span>
              <button id="increment" onclick={() => setCount(count + 1)}>
                +
              </button>
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })

      const input = document.getElementById('the-input') as HTMLInputElement
      input.focus()
      expect(document.activeElement).toBe(input)

      document.getElementById('increment')?.click()
      await flushMicrotasks()

      // After re-render, the input should still be focused (same DOM node preserved)
      expect(document.activeElement).toBe(input)
      expect(document.getElementById('the-input')).toBe(input)
    })
  })

  it('should not remount child Shade components on parent re-render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const childRenderCounter = vi.fn()
      const disconnectSpy = vi.fn()

      const ChildComponent = Shade({
        tagName: 'child-preserve-test',
        onDetach: disconnectSpy,
        render: () => {
          childRenderCounter()
          return <div>Child</div>
        },
      })

      const ParentComponent = Shade({
        tagName: 'parent-preserve-test',
        render: ({ useState }) => {
          const [count, setCount] = useState('count', 0)
          return (
            <div>
              <ChildComponent />
              <button id="increment" onclick={() => setCount(count + 1)}>
                +
              </button>
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ParentComponent /> })
      expect(childRenderCounter).toHaveBeenCalledTimes(1)
      expect(disconnectSpy).not.toHaveBeenCalled()

      const childEl = document.querySelector('child-preserve-test') as JSX.Element

      // Trigger parent re-render
      document.getElementById('increment')?.click()
      await flushMicrotasks()
      // Allow child's scheduled update to complete
      await flushMicrotasks()

      // Child should be preserved (not disconnected and remounted)
      expect(disconnectSpy).not.toHaveBeenCalled()
      expect(document.querySelector('child-preserve-test')).toBe(childEl)
    })
  })

  it('should support reactive text binding without re-render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const ExampleComponent = Shade({
        tagName: 'reactive-text-test',
        render: ({ useDisposable }) => {
          const count = useDisposable('count', () => new ObservableValue(0))
          renderCounter()
          return (
            <div>
              <span id="display">{count}</span>
              <button id="increment" onclick={() => count.setValue(count.getValue() + 1)}>
                +
              </button>
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)
      expect(document.getElementById('display')?.textContent).toBe('0')

      // Click changes the observable directly, no re-render needed
      document.getElementById('increment')?.click()

      // No re-render, but text updates reactively
      expect(renderCounter).toHaveBeenCalledTimes(1)
      expect(document.getElementById('display')?.textContent).toBe('1')

      document.getElementById('increment')?.click()
      expect(renderCounter).toHaveBeenCalledTimes(1)
      expect(document.getElementById('display')?.textContent).toBe('2')
    })
  })

  it('should clean up reactive bindings on component unmount', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const obs = new ObservableValue(0)

      const ExampleComponent = Shade({
        tagName: 'reactive-cleanup-test',
        render: () => {
          return <span>{obs}</span>
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      // The reactive text node subscription
      expect(obs.getObservers().length).toBe(1)

      // Remove component
      document.body.innerHTML = ''
      await sleepAsync(10)

      expect(obs.getObservers().length).toBe(0)
    })
  })

  it('should support batching + reconciliation combined', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const obs1 = new ObservableValue(0)
      const obs2 = new ObservableValue('a')

      const ExampleComponent = Shade({
        tagName: 'batch-reconcile-test',
        render: ({ useObservable }) => {
          const [val1] = useObservable('obs1', obs1)
          const [val2] = useObservable('obs2', obs2)
          renderCounter()
          return (
            <div>
              <span id="val1">{val1}</span>
              <span id="val2">{val2}</span>
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)

      const span1 = document.getElementById('val1')
      const span2 = document.getElementById('val2')

      // Change both synchronously
      obs1.setValue(1)
      obs2.setValue('b')

      await flushMicrotasks()

      // Only one render
      expect(renderCounter).toHaveBeenCalledTimes(2)

      // DOM preserved (same elements)
      expect(document.getElementById('val1')).toBe(span1)
      expect(document.getElementById('val2')).toBe(span2)

      // Content updated
      expect(document.getElementById('val1')?.textContent).toBe('1')
      expect(document.getElementById('val2')?.textContent).toBe('b')
    })
  })
})
