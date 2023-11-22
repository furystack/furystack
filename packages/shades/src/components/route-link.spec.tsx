import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { RouteLink } from './route-link.js'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocationService } from '../services/location-service.js'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'

describe('RouteLink', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld display the loader and completed state', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const onRouteChange = vi.fn()

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
      '<div id="root"><a is="route-link" id="route" href="/subroute" style="text-decoration: inherit;">Link</a></div>',
    )
    expect(onRouteChange).not.toBeCalled()
    document.getElementById('route')?.click()
    expect(onRouteChange).toBeCalledTimes(1)
  })
})
