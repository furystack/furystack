import { Injector } from '@furystack/inject'
import { serializeToQueryString } from '@furystack/rest'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { flushUpdates, Shade } from './shade.js'

describe('Shades integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should mount a custom component to a Shade root', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({ render: () => <div>Hello</div>, shadowDomName: 'shades-example' })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe('<div id="root"><shades-example><div>Hello</div></shades-example></div>')
    })
  })

  it('Should mount a custom component with a string render result', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({ render: () => 'Hello', shadowDomName: 'shades-string-render-result' })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-string-render-result>Hello</shades-string-render-result></div>',
      )
    })
  })

  it('Should mount a custom component with null render result', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({ render: () => null, shadowDomName: 'shades-null-render-result' })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-null-render-result></shades-null-render-result></div>',
      )
    })
  })

  it('Should mount a custom component with a document fragment render result', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-fragment-render-result><p>1</p><p>2</p></shades-fragment-render-result></div>',
      )
    })
  })

  it('Should mount a custom component with a nested document fragment render result', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-fragment-render-result-nested><p><p>1</p><p>2</p></p></shades-fragment-render-result-nested></div>',
      )
    })
  })

  it('Should mount a custom component with a document fragment that contains custom components', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-fragment-render-result-2><shades-fragment-test-custom-component><p>Hello</p></shades-fragment-test-custom-component><shades-fragment-test-custom-component><p>Hello</p></shades-fragment-test-custom-component></shades-fragment-render-result-2></div>',
      )
    })
  })

  it('Should mount nested Shades components', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><shades-example-2><div><shades-example-sub><div>1</div></shades-example-sub><shades-example-sub><div>2</div></shades-example-sub><shades-example-sub><div>3</div></shades-example-sub></div></shades-example-2></div>',
      )
    })
  })

  it('Should execute useDisposable cleanup on component disconnection', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const cleanup = vi.fn()
      const setup = vi.fn()

      const ExampleComponent = Shade({
        shadowDomName: 'example-component-1',
        render: ({ useDisposable }) => {
          useDisposable('test', () => {
            setup()
            return { [Symbol.dispose]: cleanup }
          })
          return <div>Hello</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()
      expect(setup).toBeCalled()
      expect(cleanup).not.toBeCalled()
      document.body.innerHTML = ''
      await sleepAsync(10) // Dispose can be async
      expect(cleanup).toBeCalled()
    })
  })

  it('Should update state', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'example-component-3',
        render: ({ useState }) => {
          const [count, setCount] = useState('count', 0)
          return (
            <div>
              Count is {count}
              <button id="plus" onclick={() => setCount(count + 1)}>
                +
              </button>
              <button id="minus" onclick={() => setCount(count - 1)}>
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
      await flushUpdates()

      const plus = async () => {
        document.getElementById('plus')?.click()
        await flushUpdates()
      }
      const minus = async () => {
        document.getElementById('minus')?.click()
        await flushUpdates()
      }
      const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)

      expectCount(0)
      await plus()
      expectCount(1)
      await plus()
      expectCount(2)

      await minus()
      await minus()
      expectCount(0)
    })
  })

  it('Should update the stored state', async () => {
    const mockedStorage = new Map<string, string>()

    const store: typeof localStorage = {
      getItem: (key) => {
        return mockedStorage.get(key) || null
      },
      setItem: (key, value) => {
        mockedStorage.set(key, value)
      },
      length: 0,
      clear: () => {
        mockedStorage.clear()
      },
      key: (index) => {
        return Array.from(mockedStorage.keys())[index] || null
      },
      removeItem: (key) => {
        mockedStorage.delete(key)
      },
    }

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'example-component-3-stored-state',
        render: ({ useStoredState }) => {
          const [count, setCount] = useStoredState('count', 0, store)
          return (
            <div>
              Count is {count}
              <button id="plus" onclick={() => setCount(count + 1)}>
                +
              </button>
              <button id="minus" onclick={() => setCount(count - 1)}>
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
      await flushUpdates()

      const plus = async () => {
        document.getElementById('plus')?.click()
        await flushUpdates()
      }
      const minus = async () => {
        document.getElementById('minus')?.click()
        await flushUpdates()
      }
      const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)

      await sleepAsync(100)

      expectCount(0)

      await sleepAsync(100)
      await plus()
      expectCount(1)
      expect(store.getItem('count')).toBe('1')

      await plus()
      expectCount(2)
      expect(store.getItem('count')).toBe('2')

      await minus()
      await minus()
      expectCount(0)
      expect(store.getItem('count')).toBe('0')
    })
  })

  it('Should update the search state', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'example-component-3-search-state',
        render: ({ useSearchState }) => {
          const [count, setCount] = useSearchState('count', 0)
          return (
            <div>
              Count is {count}
              <button id="plus" onclick={() => setCount(count + 1)}>
                +
              </button>
              <button id="minus" onclick={() => setCount(count - 1)}>
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
      await flushUpdates()

      const plus = async () => {
        document.getElementById('plus')?.click()
        await flushUpdates()
      }
      const minus = async () => {
        document.getElementById('minus')?.click()
        await flushUpdates()
      }
      const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)

      expectCount(0)

      await sleepAsync(100)
      await plus()
      expectCount(1)
      expect(location.search).toBe(`?${serializeToQueryString({ count: 1 })}`)

      await plus()
      expectCount(2)
      expect(location.search).toBe(`?${serializeToQueryString({ count: 2 })}`)

      await minus()
      await minus()
      expectCount(0)
      expect(location.search).toBe(`?${serializeToQueryString({ count: 0 })}`)
    })
  })

  it('Should allow children update after unmount and remount', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const Parent = Shade({
        shadowDomName: 'shade-remount-parent',
        render: ({ children, useState }) => {
          const [areChildrenVisible, setAreChildrenVisible] = useState('areChildrenVisible', true)
          return (
            <div>
              <button
                id="showHideChildren"
                onclick={() => {
                  setAreChildrenVisible(!areChildrenVisible)
                }}
              >
                Toggle
              </button>
              {areChildrenVisible ? children : null}
            </div>
          )
        },
      })

      const Child = Shade({
        shadowDomName: 'example-remount-child',
        render: ({ useState }) => {
          const [count, setCount] = useState('count', 0)

          return (
            <div>
              Count is {`${count}`}
              <button id="plus" onclick={() => setCount(count + 1)}>
                +
              </button>
              <button id="minus" onclick={() => setCount(count - 1)}>
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
      await flushUpdates()

      const plus = async () => {
        document.getElementById('plus')?.click()
        await flushUpdates()
      }
      const minus = async () => {
        document.getElementById('minus')?.click()
        await flushUpdates()
      }

      const expectCount = (count: number) => expect(document.body.innerHTML).toContain(`Count is ${count}`)
      const toggleChildren = async () => {
        document.getElementById('showHideChildren')?.click()
        await flushUpdates()
      }

      expectCount(0)
      await plus()
      expectCount(1)

      await toggleChildren()

      expect(document.getElementById('plus')).toBeNull()

      await sleepAsync(10) // Dispose can be async

      await toggleChildren()
      expect(document.getElementById('plus')).toBeDefined()

      expectCount(0)
      await plus()
      expectCount(1)
      await minus()
      expectCount(0)
    })
  })

  it('Should propagate changed props from parent to child Shade component', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ChildComponent = Shade<{ isDisabled: boolean }>({
        shadowDomName: 'shade-prop-child',
        render: ({ props }) => {
          return <input type="checkbox" disabled={props.isDisabled} data-testid="inner-input" />
        },
      })

      const ParentComponent = Shade({
        shadowDomName: 'shade-prop-parent',
        render: ({ useState }) => {
          const [isDisabled, setIsDisabled] = useState('isDisabled', false)
          return (
            <div>
              <button id="toggle-disabled" onclick={() => setIsDisabled(!isDisabled)}>
                Toggle
              </button>
              <ChildComponent isDisabled={isDisabled} />
            </div>
          )
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ParentComponent />,
      })

      await flushUpdates()
      await flushUpdates()

      const innerInput = document.querySelector('[data-testid="inner-input"]') as HTMLInputElement
      expect(innerInput).toBeTruthy()
      expect(innerInput.disabled).toBe(false)

      // Click the toggle button
      const toggleBtn = document.getElementById('toggle-disabled') as HTMLButtonElement
      toggleBtn.click()

      // Wait for parent re-render + child re-render (two microtask levels)
      await flushUpdates()
      await flushUpdates()
      await flushUpdates()

      const updatedInput = document.querySelector('[data-testid="inner-input"]') as HTMLInputElement
      expect(updatedInput.disabled).toBe(true)
    })
  })
})
