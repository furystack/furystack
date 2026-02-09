import { Injector } from '@furystack/inject'
import { ObservableValue, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initializeShadeRoot } from './initialize.js'
import { createComponent } from './shade-component.js'
import { flushUpdates, Shade } from './shade.js'

describe('useHostProps integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should set data attributes on the host element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade<{ variant: string }>({
        shadowDomName: 'host-props-data-attr-test',
        render: ({ props, useHostProps }) => {
          useHostProps({
            'data-variant': props.variant,
          })
          return <div>content</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent variant="primary" />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-data-attr-test') as HTMLElement
      expect(el).toBeTruthy()
      expect(el.getAttribute('data-variant')).toBe('primary')
    })
  })

  it('should set aria attributes on the host element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-aria-test',
        render: ({ useHostProps }) => {
          useHostProps({
            role: 'progressbar',
            'aria-valuenow': '50',
            'aria-valuemin': '0',
            'aria-valuemax': '100',
          })
          return <div>progress</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-aria-test') as HTMLElement
      expect(el.getAttribute('role')).toBe('progressbar')
      expect(el.getAttribute('aria-valuenow')).toBe('50')
      expect(el.getAttribute('aria-valuemin')).toBe('0')
      expect(el.getAttribute('aria-valuemax')).toBe('100')
    })
  })

  it('should apply CSS custom properties via style', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-css-vars-test',
        render: ({ useHostProps }) => {
          useHostProps({
            style: {
              '--my-color': 'red',
              '--my-size': '16px',
            },
          })
          return <div>styled</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-css-vars-test') as HTMLElement
      expect(el.style.getPropertyValue('--my-color')).toBe('red')
      expect(el.style.getPropertyValue('--my-size')).toBe('16px')
    })
  })

  it('should apply standard inline styles', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-inline-style-test',
        render: ({ useHostProps }) => {
          useHostProps({
            style: {
              display: 'flex',
              gap: '8px',
            },
          })
          return <div>styled</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-inline-style-test') as HTMLElement
      expect(el.style.display).toBe('flex')
      expect(el.style.gap).toBe('8px')
    })
  })

  it('should merge multiple useHostProps calls', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-merge-test',
        render: ({ useHostProps }) => {
          useHostProps({
            'data-first': 'one',
            style: { '--color-a': 'red' },
          })
          useHostProps({
            'data-second': 'two',
            style: { '--color-b': 'blue' },
          })
          return <div>merged</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-merge-test') as HTMLElement
      expect(el.getAttribute('data-first')).toBe('one')
      expect(el.getAttribute('data-second')).toBe('two')
      expect(el.style.getPropertyValue('--color-a')).toBe('red')
      expect(el.style.getPropertyValue('--color-b')).toBe('blue')
    })
  })

  it('should remove attributes when they are no longer set on re-render', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const showExtra = new ObservableValue(true)

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-remove-attr-test',
        render: ({ useHostProps, useObservable }) => {
          const [show] = useObservable('showExtra', showExtra)
          useHostProps({
            'data-always': 'yes',
            ...(show ? { 'data-extra': 'present' } : {}),
          })
          return <div>content</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-remove-attr-test') as HTMLElement
      expect(el.getAttribute('data-always')).toBe('yes')
      expect(el.getAttribute('data-extra')).toBe('present')

      showExtra.setValue(false)
      await flushUpdates()

      expect(el.getAttribute('data-always')).toBe('yes')
      expect(el.getAttribute('data-extra')).toBeNull()
    })
  })

  it('should remove CSS custom properties when they are no longer set', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const showColor = new ObservableValue(true)

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-remove-css-var-test',
        render: ({ useHostProps, useObservable }) => {
          const [show] = useObservable('showColor', showColor)
          useHostProps({
            style: {
              display: 'block',
              ...(show ? { '--my-color': 'red' } : {}),
            },
          })
          return <div>content</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-remove-css-var-test') as HTMLElement
      expect(el.style.getPropertyValue('--my-color')).toBe('red')
      expect(el.style.display).toBe('block')

      showColor.setValue(false)
      await flushUpdates()

      expect(el.style.getPropertyValue('--my-color')).toBe('')
      expect(el.style.display).toBe('block')
    })
  })

  it('should set event handlers on the host element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      let clicked = false

      const ExampleComponent = Shade({
        shadowDomName: 'host-props-event-test',
        render: ({ useHostProps }) => {
          useHostProps({
            onclick: () => {
              clicked = true
            },
          })
          return <div>clickable</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const el = document.querySelector('host-props-event-test') as HTMLElement
      el.click()
      expect(clicked).toBe(true)
    })
  })
})

describe('useRef integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should set ref.current to the mounted element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let capturedRef: { readonly current: HTMLDivElement | null } | undefined

      const ExampleComponent = Shade({
        shadowDomName: 'use-ref-basic-test',
        render: ({ useRef }) => {
          const divRef = useRef<HTMLDivElement>('myDiv')
          capturedRef = divRef
          return (
            <div ref={divRef} id="target">
              hello
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

      expect(capturedRef).toBeTruthy()
      expect(capturedRef!.current).toBeTruthy()
      expect(capturedRef!.current).toBe(document.getElementById('target'))
      expect(capturedRef!.current?.textContent).toBe('hello')
    })
  })

  it('should return the same ref object across re-renders', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const counter = new ObservableValue(0)

      const capturedRefs: Array<{ readonly current: Element | null }> = []

      const ExampleComponent = Shade({
        shadowDomName: 'use-ref-stable-test',
        render: ({ useRef, useObservable }) => {
          const [count] = useObservable('counter', counter)
          const divRef = useRef('myDiv')
          capturedRefs.push(divRef)
          return <div ref={divRef}>{count}</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      counter.setValue(1)
      await flushUpdates()

      counter.setValue(2)
      await flushUpdates()

      expect(capturedRefs.length).toBe(3)
      expect(capturedRefs[0]).toBe(capturedRefs[1])
      expect(capturedRefs[1]).toBe(capturedRefs[2])
    })
  })

  it('should set ref.current on nested child elements', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      let capturedInputRef: { readonly current: HTMLInputElement | null } | undefined

      const ExampleComponent = Shade({
        shadowDomName: 'use-ref-nested-test',
        render: ({ useRef }) => {
          const inputRef = useRef<HTMLInputElement>('input')
          capturedInputRef = inputRef
          return (
            <div>
              <label>
                <input ref={inputRef} type="text" id="my-input" />
              </label>
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

      expect(capturedInputRef).toBeTruthy()
      expect(capturedInputRef!.current).toBeTruthy()
      expect(capturedInputRef!.current).toBe(document.getElementById('my-input'))
      expect(capturedInputRef!.current?.type).toBe('text')
    })
  })

  it('should clear ref.current when element is unmounted', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const showChild = new ObservableValue(true)

      let capturedRef: { readonly current: HTMLSpanElement | null } | undefined

      const ExampleComponent = Shade({
        shadowDomName: 'use-ref-unmount-test',
        render: ({ useRef, useObservable }) => {
          const [show] = useObservable('showChild', showChild)
          const spanRef = useRef<HTMLSpanElement>('span')
          capturedRef = spanRef
          return <div>{show ? <span ref={spanRef}>visible</span> : null}</div>
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      expect(capturedRef!.current).toBeTruthy()
      expect(capturedRef!.current?.textContent).toBe('visible')

      showChild.setValue(false)
      await flushUpdates()

      expect(capturedRef!.current).toBeNull()
    })
  })

  it('should work with useRef in onChange callbacks', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const counter = new ObservableValue(0)

      const ExampleComponent = Shade({
        shadowDomName: 'use-ref-onchange-test',
        render: ({ useRef, useObservable }) => {
          const spanRef = useRef<HTMLSpanElement>('counterSpan')
          useObservable('counter', counter, {
            onChange: (value) => {
              if (spanRef.current) {
                spanRef.current.textContent = String(value)
              }
            },
          })
          return (
            <span ref={spanRef} id="counter-span">
              0
            </span>
          )
        },
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <ExampleComponent />,
      })
      await flushUpdates()

      const span = document.getElementById('counter-span')
      expect(span?.textContent).toBe('0')

      counter.setValue(42)
      await flushUpdates()

      expect(span?.textContent).toBe('42')
    })
  })
})
