import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { RouteLink } from './route-link'
import { createComponent, initializeShadeRoot, LocationService } from '..'

describe('RouteLink', () => {
  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Shuld display the loader and completed state', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const onRouteChange = jest.fn()

    injector.getInstance(LocationService).onLocationPathChanged.subscribe(onRouteChange)

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
      '<div id="root"><route-link id="route"><a href="/subroute" style="text-decoration: inherit;">Link</a></route-link></div>',
    )
    expect(onRouteChange).not.toBeCalled()
    document.getElementById('route')?.click()
    expect(onRouteChange).toBeCalledTimes(1)
  })
})
