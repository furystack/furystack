import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { RouteLink } from './route-link'
import { JSDOM } from 'jsdom'
import { createComponent, initializeShadeRoot, LocationService } from '..'

describe('RouteLink', () => {
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

    const onRouteChange = jest.fn()

    injector.getInstance(LocationService).onLocationChanged.subscribe(onRouteChange)

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <RouteLink id="route" href="/subroute">
          Link
        </RouteLink>
      ),
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><route-link><a id="route" href="/subroute">Link</a></route-link></div>',
    )
    expect(onRouteChange).not.toBeCalled()
    document.getElementById('route')?.click()
    expect(onRouteChange).toBeCalledTimes(1)
  })
})
