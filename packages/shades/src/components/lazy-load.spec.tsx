import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'
import { LazyLoad } from './lazy-load'
import { JSDOM } from 'jsdom'
import { createComponent, initializeShadeRoot } from '..'

describe('Lazy Load', () => {
  const oldDoc = document

  beforeAll(() => {
    globalThis.document = new JSDOM().window.document
    window.matchMedia = () => ({ matches: true } as any)
  })

  afterAll(() => {
    globalThis.document = oldDoc
  })

  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Shuld display the loader and completed state', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <LazyLoad
          loader={<div>Loading...</div>}
          component={async () => {
            await sleepAsync(100)
            return <div>Loaded</div>
          }}
        />
      ),
    })
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
    await sleepAsync(150)
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loaded</div></lazy-load></div>')
  })

  it('Shuld display the failed state with a retryer', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const load = jest.fn(async () => {
      throw Error(':(')
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <LazyLoad
          loader={<div>Loading...</div>}
          component={load}
          error={(e, retry) => (
            <button id="retry" onclick={retry}>
              {(e as Error).message}
            </button>
          )}
        />
      ),
    })
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
    await sleepAsync(1)
    expect(load).toBeCalledTimes(1)
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><button id="retry">:(</button></lazy-load></div>')
    document.getElementById('retry')?.click()
    await sleepAsync(1)
    expect(load).toBeCalledTimes(2)
  })

  it('Shuld display the failed state with a retryer', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    let counter = 0

    const load = jest.fn(async () => {
      if (!counter) {
        counter += 1
        throw Error(':(')
      }
      return <div>success</div>
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <LazyLoad
          loader={<div>Loading...</div>}
          component={load}
          error={(e, retry) => (
            <button id="retry" onclick={retry}>
              {(e as Error).message}
            </button>
          )}
        />
      ),
    })
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
    await sleepAsync(1)
    expect(load).toBeCalledTimes(1)
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><button id="retry">:(</button></lazy-load></div>')
    document.getElementById('retry')?.click()
    expect(load).toBeCalledTimes(2)
    expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>success</div></lazy-load></div>')
  })
})
