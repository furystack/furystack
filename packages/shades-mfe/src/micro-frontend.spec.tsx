import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

import { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'

import { createComponent, initializeShadeRoot, Shade } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShadesMicroFrontend } from './create-shades-micro-frontend.js'
import { MicroFrontend } from './micro-frontend.js'

describe('<MicroFrontend /> component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Should render the MFE app', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const MfeComponent = Shade<{ value: string }>({
      shadowDomName: 'mfe-test-example',
      render: ({ props }) => <div>Loaded: {props.value}</div>,
    })

    const value = crypto.randomUUID()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MicroFrontend
          api={{ value }}
          loaderCallback={async () => {
            return createShadesMicroFrontend(MfeComponent)
          }}
        />
      ),
    })

    await sleepAsync(1)

    expect(document.body.innerHTML).toBe(
      `<div id="root"><shade-micro-frontend><mfe-test-example><div>Loaded: ${value}</div></mfe-test-example></shade-micro-frontend></div>`,
    )
  })

  it('Should render the MFE app with a loader', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const MfeComponent = Shade<{ value: string }>({
      shadowDomName: 'mfe-test-example-w-loader',
      render: ({ props }) => <div>Loaded: {props.value}</div>,
    })

    const value = crypto.randomUUID()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MicroFrontend
          loader={<div>Loading...</div>}
          api={{ value }}
          loaderCallback={async () => {
            await sleepAsync(10)
            return createShadesMicroFrontend(MfeComponent)
          }}
        />
      ),
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><shade-micro-frontend><div>Loading...</div></shade-micro-frontend></div>',
    )
    await sleepAsync(20)
    expect(document.body.innerHTML).toBe(
      `<div id="root"><shade-micro-frontend><mfe-test-example-w-loader><div>Loaded: ${value}</div></mfe-test-example-w-loader></shade-micro-frontend></div>`,
    )
  })

  it('Should render the MFE app with an error', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <MicroFrontend
          error={() => <div>Error...</div>}
          api={{}}
          loaderCallback={async () => {
            throw Error(':(')
          }}
        />
      ),
    })
    await sleepAsync(10)
    expect(document.body.innerHTML).toBe(
      `<div id="root"><shade-micro-frontend><div>Error...</div></shade-micro-frontend></div>`,
    )
  })

  it('Should execute the destroy callback', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const value = crypto.randomUUID()

    const destroy = vi.fn()

    const Host = Shade({
      shadowDomName: 'mfe-test-example-w-destroy-host',
      render: ({ useState }) => {
        const [hasMfe, setHasMfe] = useState('hasMfe', true)
        return (
          <>
            <button
              onclick={() => {
                setHasMfe(false)
              }}
            >
              Remove MFE
            </button>
            {hasMfe && (
              <MicroFrontend
                loader={<div>Loading...</div>}
                api={{ value }}
                loaderCallback={async () => {
                  return {
                    create: () => {},
                    destroy,
                  }
                }}
              />
            )}
          </>
        )
      },
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <Host />,
    })
    await sleepAsync(10)
    expect(document.body.innerHTML).toBe(
      '<div id="root"><mfe-test-example-w-destroy-host><button>Remove MFE</button><shade-micro-frontend></shade-micro-frontend></mfe-test-example-w-destroy-host></div>',
    )
    document.querySelector('button')!.click()
    await sleepAsync(10)
    expect(destroy).toHaveBeenCalledWith({ api: { value }, injector: expect.any(Injector) })
    expect(document.body.innerHTML).toBe(
      `<div id="root"><mfe-test-example-w-destroy-host><button>Remove MFE</button></mfe-test-example-w-destroy-host></div>`,
    )
  })
})
