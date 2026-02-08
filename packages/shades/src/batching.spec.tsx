import { Injector } from '@furystack/inject'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { Shade } from './shade.js'

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('Microtask batching', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should batch two synchronous observable changes into one render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const obs1 = new ObservableValue(0)
      const obs2 = new ObservableValue('a')

      const ExampleComponent = Shade({
        tagName: 'batching-test-two-obs',
        render: ({ useObservable }) => {
          const [val1] = useObservable('obs1', obs1)
          const [val2] = useObservable('obs2', obs2)
          renderCounter()
          return (
            <div>
              {val1}-{val2}
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)

      // Change both synchronously
      obs1.setValue(1)
      obs2.setValue('b')

      // Before microtask flush, no additional render
      expect(renderCounter).toHaveBeenCalledTimes(1)

      await flushMicrotasks()
      // After flush, exactly one additional render
      expect(renderCounter).toHaveBeenCalledTimes(2)
    })
  })

  it('should batch three synchronous observable changes into one render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const obs1 = new ObservableValue(0)
      const obs2 = new ObservableValue(0)
      const obs3 = new ObservableValue(0)

      const ExampleComponent = Shade({
        tagName: 'batching-test-three-obs',
        render: ({ useObservable }) => {
          useObservable('obs1', obs1)
          useObservable('obs2', obs2)
          useObservable('obs3', obs3)
          renderCounter()
          return <div />
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)

      obs1.setValue(1)
      obs2.setValue(2)
      obs3.setValue(3)

      await flushMicrotasks()
      expect(renderCounter).toHaveBeenCalledTimes(2)
    })
  })

  it('should allow direct updateComponent() for synchronous updates', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const ExampleComponent = Shade({
        tagName: 'batching-test-sync-update',
        render: () => {
          renderCounter()
          return <div />
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)

      const el = document.querySelector('batching-test-sync-update') as JSX.Element
      el.updateComponent()
      // Synchronous - renders immediately
      expect(renderCounter).toHaveBeenCalledTimes(2)
    })
  })

  it('should batch multiple useState setters in one handler into one render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const renderCounter = vi.fn()

      const ExampleComponent = Shade({
        tagName: 'batching-test-usestate',
        render: ({ useState }) => {
          const [count, setCount] = useState('count', 0)
          const [name, setName] = useState('name', 'initial')
          renderCounter()
          return (
            <div>
              <span id="display">
                {count}-{name}
              </span>
              <button
                id="update-both"
                onclick={() => {
                  setCount(count + 1)
                  setName('updated')
                }}
              >
                Update
              </button>
            </div>
          )
        },
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })
      expect(renderCounter).toHaveBeenCalledTimes(1)

      document.getElementById('update-both')?.click()

      // Before flush, still only 1 render
      expect(renderCounter).toHaveBeenCalledTimes(1)

      await flushMicrotasks()
      expect(renderCounter).toHaveBeenCalledTimes(2)
      expect(document.getElementById('display')?.textContent).toBe('1-updated')
    })
  })

  it('should be a no-op if scheduleUpdate is called after component disconnect', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        tagName: 'batching-test-disconnect',
        render: () => <div>Hello</div>,
      })

      initializeShadeRoot({ injector, rootElement, jsxElement: <ExampleComponent /> })

      const el = document.querySelector('batching-test-disconnect') as JSX.Element
      expect(el.getRenderCount()).toBe(1)

      // Remove from DOM
      el.remove()
      await sleepAsync(10)

      // Schedule update after disconnect - should not throw
      el.scheduleUpdate()
      await flushMicrotasks()

      // Render count should not increase
      expect(el.getRenderCount()).toBe(1)
    })
  })
})
