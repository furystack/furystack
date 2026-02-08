import { Injector } from '@furystack/inject'
import { ObservableValue, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { flushUpdates, Shade } from './shade.js'

describe('VNode reconciliation integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('focus preservation', () => {
    it('should preserve focus on an input element across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-focus-test',
          render: ({ useState }) => {
            const [label, setLabel] = useState('label', 'initial')
            return (
              <div>
                <label>{label}</label>
                <input id="my-input" type="text" />
                <button id="update-label" onclick={() => setLabel('updated')}>
                  Update
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

        const input = document.getElementById('my-input') as HTMLInputElement
        input.focus()
        expect(document.activeElement).toBe(input)

        // Trigger a re-render by clicking the button
        document.getElementById('update-label')?.click()
        await flushUpdates()

        // The label should have updated
        expect(document.querySelector('label')?.textContent).toBe('updated')

        // The same input element should still be in the DOM and focused
        const inputAfter = document.getElementById('my-input') as HTMLInputElement
        expect(inputAfter).toBe(input)
        expect(document.activeElement).toBe(input)
      })
    })

    it('should preserve focus on a textarea across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-focus-textarea-test',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <div>
                <span>Count: {count}</span>
                <textarea id="my-textarea" />
                <button id="increment" onclick={() => setCount(count + 1)}>
                  +
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

        const textarea = document.getElementById('my-textarea') as HTMLTextAreaElement
        textarea.focus()
        expect(document.activeElement).toBe(textarea)

        document.getElementById('increment')?.click()
        await flushUpdates()

        expect(document.querySelector('span')?.textContent).toBe('Count: 1')
        expect(document.getElementById('my-textarea')).toBe(textarea)
        expect(document.activeElement).toBe(textarea)
      })
    })
  })

  describe('form value preservation', () => {
    it('should preserve user-typed input value across re-renders when value is not controlled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-form-value-test',
          render: ({ useState }) => {
            const [title, setTitle] = useState('title', 'Title')
            return (
              <div>
                <h1>{title}</h1>
                <input id="user-input" type="text" />
                <button id="change-title" onclick={() => setTitle('New Title')}>
                  Change
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

        // Simulate user typing
        const input = document.getElementById('user-input') as HTMLInputElement
        input.value = 'user typed this'

        // Trigger re-render
        document.getElementById('change-title')?.click()
        await flushUpdates()

        // Title should have changed
        expect(document.querySelector('h1')?.textContent).toBe('New Title')

        // Input value should be preserved (same element, value not in render props)
        const inputAfter = document.getElementById('user-input') as HTMLInputElement
        expect(inputAfter).toBe(input)
        expect(inputAfter.value).toBe('user typed this')
      })
    })

    it('should preserve checkbox checked state across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-checkbox-test',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <div>
                <span>Count: {count}</span>
                <input id="my-checkbox" type="checkbox" />
                <button id="increment" onclick={() => setCount(count + 1)}>
                  +
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

        // User checks the checkbox
        const checkbox = document.getElementById('my-checkbox') as HTMLInputElement
        checkbox.checked = true

        // Trigger re-render
        document.getElementById('increment')?.click()
        await flushUpdates()

        expect(document.querySelector('span')?.textContent).toBe('Count: 1')

        // Checkbox should still be checked
        const checkboxAfter = document.getElementById('my-checkbox') as HTMLInputElement
        expect(checkboxAfter).toBe(checkbox)
        expect(checkboxAfter.checked).toBe(true)
      })
    })

    it('should preserve select value across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-select-test',
          render: ({ useState }) => {
            const [label, setLabel] = useState('label', 'Pick one')
            return (
              <div>
                <label>{label}</label>
                <select id="my-select">
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                </select>
                <button id="update-label" onclick={() => setLabel('Updated label')}>
                  Update
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

        // User selects option B
        const select = document.getElementById('my-select') as HTMLSelectElement
        select.value = 'b'

        // Trigger re-render
        document.getElementById('update-label')?.click()
        await flushUpdates()

        expect(document.querySelector('label')?.textContent).toBe('Updated label')

        // Select should still have value 'b'
        const selectAfter = document.getElementById('my-select') as HTMLSelectElement
        expect(selectAfter).toBe(select)
        expect(selectAfter.value).toBe('b')
      })
    })
  })

  describe('element identity preservation', () => {
    it('should preserve DOM element references across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-identity-test',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <div id="container">
                <span id="counter">Count: {count}</span>
                <button id="increment" onclick={() => setCount(count + 1)}>
                  +
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

        const container = document.getElementById('container')
        const counter = document.getElementById('counter')
        const button = document.getElementById('increment')

        // Trigger re-render
        button?.click()
        await flushUpdates()

        // Same elements should be reused
        expect(document.getElementById('container')).toBe(container)
        expect(document.getElementById('counter')).toBe(counter)
        expect(document.getElementById('increment')).toBe(button)
        expect(counter?.textContent).toBe('Count: 1')
      })
    })

    it('should replace element when tag changes between renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-tag-change-test',
          render: ({ useState }) => {
            const [useDiv, setUseDiv] = useState('useDiv', true)
            return useDiv ? (
              <div id="content">
                <button id="toggle" onclick={() => setUseDiv(false)}>
                  Toggle
                </button>
              </div>
            ) : (
              <section id="content">
                <button id="toggle" onclick={() => setUseDiv(true)}>
                  Toggle
                </button>
              </section>
            )
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })
        await flushUpdates()

        const oldContent = document.getElementById('content')
        expect(oldContent?.tagName).toBe('DIV')

        document.getElementById('toggle')?.click()
        await flushUpdates()

        const newContent = document.getElementById('content')
        expect(newContent?.tagName).toBe('SECTION')
        // Different tag means different element
        expect(newContent).not.toBe(oldContent)
      })
    })
  })

  describe('animation continuity', () => {
    it('should preserve CSS class-based transitions by keeping element identity', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-animation-test',
          render: ({ useState }) => {
            const [isActive, setIsActive] = useState('isActive', false)
            return (
              <div>
                <div id="animated-box" className={isActive ? 'active' : 'inactive'} />
                <button id="activate" onclick={() => setIsActive(true)}>
                  Activate
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

        const box = document.getElementById('animated-box')
        expect(box?.className).toBe('inactive')

        document.getElementById('activate')?.click()
        await flushUpdates()

        // Same element, class updated in place (animation would continue)
        const boxAfter = document.getElementById('animated-box')
        expect(boxAfter).toBe(box)
        expect(boxAfter?.className).toBe('active')
      })
    })

    it('should preserve inline style transitions by keeping element identity', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-style-transition-test',
          render: ({ useState }) => {
            const [isExpanded, setIsExpanded] = useState('isExpanded', false)
            return (
              <div>
                <div
                  id="expandable"
                  style={{
                    height: isExpanded ? '200px' : '50px',
                    transition: 'height 0.3s ease',
                  }}
                />
                <button id="expand" onclick={() => setIsExpanded(!isExpanded)}>
                  Toggle
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

        const expandable = document.getElementById('expandable')
        expect(expandable?.style.height).toBe('50px')

        document.getElementById('expand')?.click()
        await flushUpdates()

        // Same element, style updated in place (transition would animate)
        const expandableAfter = document.getElementById('expandable')
        expect(expandableAfter).toBe(expandable)
        expect(expandableAfter?.style.height).toBe('200px')
        expect(expandableAfter?.style.transition).toBe('height 0.3s ease')
      })
    })
  })

  describe('event handler updates', () => {
    it('should update event handlers after re-render (closures capture new state)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const clicks: number[] = []

        const ExampleComponent = Shade({
          shadowDomName: 'morph-handler-test',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <div>
                <span id="count">{count}</span>
                <button
                  id="increment"
                  onclick={() => {
                    clicks.push(count)
                    setCount(count + 1)
                  }}
                >
                  +
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

        const button = document.getElementById('increment')!

        // First click: count is 0
        button.click()
        await flushUpdates()
        expect(clicks).toEqual([0])
        expect(document.getElementById('count')?.textContent).toBe('1')

        // Second click: handler should capture count=1 after morph
        button.click()
        await flushUpdates()
        expect(clicks).toEqual([0, 1])
        expect(document.getElementById('count')?.textContent).toBe('2')

        // Third click: handler should capture count=2
        button.click()
        await flushUpdates()
        expect(clicks).toEqual([0, 1, 2])
        expect(document.getElementById('count')?.textContent).toBe('3')
      })
    })
  })

  describe('observable-driven re-renders with morphing', () => {
    it('should morph correctly when observable drives updates', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const obs = new ObservableValue('hello')

        const ExampleComponent = Shade({
          shadowDomName: 'morph-observable-test',
          render: ({ useObservable }) => {
            const [value] = useObservable('obs', obs)
            return (
              <div>
                <span id="value">{value}</span>
                <input id="my-input" type="text" />
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

        const input = document.getElementById('my-input') as HTMLInputElement
        const span = document.getElementById('value')!
        input.value = 'user text'
        input.focus()

        // External observable change
        obs.setValue('world')
        await flushUpdates()

        // Text should update
        expect(document.getElementById('value')).toBe(span)
        expect(span.textContent).toBe('world')

        // Input should be preserved
        expect(document.getElementById('my-input')).toBe(input)
        expect(input.value).toBe('user text')
        expect(document.activeElement).toBe(input)
      })
    })
  })

  describe('fragment render result morphing', () => {
    it('should morph fragment children across re-renders', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-fragment-test',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <>
                <p id="counter">Count: {count}</p>
                <button id="increment" onclick={() => setCount(count + 1)}>
                  +
                </button>
              </>
            )
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })
        await flushUpdates()

        const counter = document.getElementById('counter')
        const button = document.getElementById('increment')

        button?.click()
        await flushUpdates()

        // Elements should be reused
        expect(document.getElementById('counter')).toBe(counter)
        expect(document.getElementById('increment')).toBe(button)
        expect(counter?.textContent).toBe('Count: 1')
      })
    })
  })

  describe('text render result optimization', () => {
    it('should efficiently update text-only render results', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const ExampleComponent = Shade({
          shadowDomName: 'morph-text-result-test',
          render: ({ useState }) => {
            const [text] = useState('text', 'initial')
            return text
          },
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <ExampleComponent />,
        })
        await flushUpdates()

        const shadeEl = document.querySelector('morph-text-result-test')!
        expect(shadeEl.textContent).toBe('initial')
        const textNode = shadeEl.firstChild

        // Trigger update via the shade element
        const el = shadeEl as JSX.Element
        ;(
          el as unknown as { resourceManager: { stateObservers: Map<string, ObservableValue<string>> } }
        ).resourceManager.stateObservers
          .get('text')
          ?.setValue('updated')
        await flushUpdates()

        expect(shadeEl.textContent).toBe('updated')
        // Text node should be reused (not recreated)
        expect(shadeEl.firstChild).toBe(textNode)
      })
    })
  })

  describe('Shade component boundary morphing', () => {
    it('should update child Shade component props without recreating it', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const childRenderSpy = vi.fn()

        const ChildComponent = Shade<{ value: number }>({
          shadowDomName: 'morph-child-component',
          render: ({ props }) => {
            childRenderSpy()
            return <span id="child-value">{props.value}</span>
          },
        })

        const ParentComponent = Shade({
          shadowDomName: 'morph-parent-component',
          render: ({ useState }) => {
            const [count, setCount] = useState('count', 0)
            return (
              <div>
                <ChildComponent value={count} />
                <button id="parent-increment" onclick={() => setCount(count + 1)}>
                  +
                </button>
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

        expect(document.getElementById('child-value')?.textContent).toBe('0')
        const childElement = document.querySelector('morph-child-component')

        // Trigger parent re-render
        document.getElementById('parent-increment')?.click()
        await flushUpdates()
        await flushUpdates()

        // Child should be the same DOM element (not recreated)
        expect(document.querySelector('morph-child-component')).toBe(childElement)
        // Child should have been updated with new props
        expect(document.getElementById('child-value')?.textContent).toBe('1')
      })
    })
  })
})
