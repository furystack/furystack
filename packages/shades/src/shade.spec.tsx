import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { Shade } from './shade.js'

describe('Shade edge cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('duplicate shadowDomName error', () => {
    it('should throw an error when registering a duplicate shadowDomName', () => {
      // First registration should succeed
      Shade({
        shadowDomName: 'shade-duplicate-test',
        render: () => <div>First</div>,
      })

      // Second registration with the same name should throw
      expect(() => {
        Shade({
          shadowDomName: 'shade-duplicate-test',
          render: () => <div>Second</div>,
        })
      }).toThrow("A custom shade with name 'shade-duplicate-test' has already been registered!")
    })

    it('should include the duplicate name in the error message', () => {
      const uniqueName = `shade-duplicate-name-in-error-${Date.now()}`

      Shade({
        shadowDomName: uniqueName,
        render: () => <div>First</div>,
      })

      try {
        Shade({
          shadowDomName: uniqueName,
          render: () => <div>Second</div>,
        })
        // Should not reach here
        expect.fail('Expected an error to be thrown')
      } catch (e) {
        expect((e as Error).message).toContain(uniqueName)
      }
    })
  })

  describe('injector from props', () => {
    it('should use props injector for child component instead of inheriting from parent', async () => {
      await usingAsync(new Injector(), async (rootInjector) => {
        await usingAsync(new Injector(), async (propsInjector) => {
          const rootElement = document.getElementById('root') as HTMLDivElement

          let parentCapturedInjector: Injector | undefined
          let childCapturedInjector: Injector | undefined

          const ChildComponent = Shade<{ injector?: Injector }>({
            shadowDomName: 'shade-injector-child-props-test',
            render: ({ injector }) => {
              childCapturedInjector = injector
              return <div>Child</div>
            },
          })

          const ParentComponent = Shade({
            shadowDomName: 'shade-injector-parent-props-test',
            render: ({ injector, children }) => {
              parentCapturedInjector = injector
              return <div>{children}</div>
            },
          })

          initializeShadeRoot({
            injector: rootInjector,
            rootElement,
            jsxElement: (
              <ParentComponent>
                <ChildComponent injector={propsInjector} />
              </ParentComponent>
            ),
          })

          await sleepAsync(10)

          // Parent should use root injector (inherited from parent)
          expect(parentCapturedInjector).toBe(rootInjector)
          // Child should use the props injector, not the parent's
          expect(childCapturedInjector).toBe(propsInjector)
          expect(childCapturedInjector).not.toBe(rootInjector)
        })
      })
    })
  })

  describe('BroadcastChannel cross-tab communication', () => {
    it('should update stored state when receiving BroadcastChannel message with matching key', async () => {
      const mockedStorage = new Map<string, string>()

      const store: typeof localStorage = {
        getItem: (key) => mockedStorage.get(key) || null,
        setItem: (key, value) => mockedStorage.set(key, value),
        length: 0,
        clear: () => mockedStorage.clear(),
        key: (index) => Array.from(mockedStorage.keys())[index] || null,
        removeItem: (key) => mockedStorage.delete(key),
      }

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const stateKey = 'broadcast-test-key'

        const ExampleComponent = Shade({
          shadowDomName: 'shade-broadcast-channel-test',
          render: ({ useStoredState }) => {
            const [value] = useStoredState(stateKey, 'initial', store)
            return <div id="value">{value}</div>
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })

        await sleepAsync(50)
        expect(document.getElementById('value')?.textContent).toBe('initial')

        // Simulate cross-tab message via BroadcastChannel
        const channel = new BroadcastChannel('useStoredState-broadcast-channel')
        channel.postMessage({ key: stateKey, value: 'updated-from-other-tab' })

        await sleepAsync(50)
        expect(document.getElementById('value')?.textContent).toBe('updated-from-other-tab')

        channel.close()
      })
    })

    it('should ignore BroadcastChannel messages with different key', async () => {
      const mockedStorage = new Map<string, string>()

      const store: typeof localStorage = {
        getItem: (key) => mockedStorage.get(key) || null,
        setItem: (key, value) => mockedStorage.set(key, value),
        length: 0,
        clear: () => mockedStorage.clear(),
        key: (index) => Array.from(mockedStorage.keys())[index] || null,
        removeItem: (key) => mockedStorage.delete(key),
      }

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const stateKey = 'broadcast-filter-test-key'

        const ExampleComponent = Shade({
          shadowDomName: 'shade-broadcast-channel-filter-test',
          render: ({ useStoredState }) => {
            const [value] = useStoredState(stateKey, 'initial', store)
            return <div id="value">{value}</div>
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })

        await sleepAsync(50)
        expect(document.getElementById('value')?.textContent).toBe('initial')

        // Simulate cross-tab message with different key
        const channel = new BroadcastChannel('useStoredState-broadcast-channel')
        channel.postMessage({ key: 'different-key', value: 'should-be-ignored' })

        await sleepAsync(50)
        // Value should remain unchanged
        expect(document.getElementById('value')?.textContent).toBe('initial')

        channel.close()
      })
    })

    it('should cleanup BroadcastChannel on component disposal', async () => {
      const mockedStorage = new Map<string, string>()

      const store: typeof localStorage = {
        getItem: (key) => mockedStorage.get(key) || null,
        setItem: (key, value) => mockedStorage.set(key, value),
        length: 0,
        clear: () => mockedStorage.clear(),
        key: (index) => Array.from(mockedStorage.keys())[index] || null,
        removeItem: (key) => mockedStorage.delete(key),
      }

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const stateKey = 'broadcast-cleanup-test-key'

        const ExampleComponent = Shade({
          shadowDomName: 'shade-broadcast-channel-cleanup-test',
          render: ({ useStoredState }) => {
            const [value] = useStoredState(stateKey, 'initial', store)
            return <div id="value">{value}</div>
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })

        await sleepAsync(50)
        expect(document.getElementById('value')?.textContent).toBe('initial')

        // Remove the component from DOM
        document.body.innerHTML = ''
        await sleepAsync(50)

        // Create a new channel to send a message (simulating another tab)
        const channel = new BroadcastChannel('useStoredState-broadcast-channel')
        // This should not cause any errors since the component's channel should be closed
        channel.postMessage({ key: stateKey, value: 'should-not-crash' })
        await sleepAsync(50)

        channel.close()
        // Test passes if no errors occur
      })
    })
  })
})
