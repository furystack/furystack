import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { LinkToRoute } from './link-to-route.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import type { Route } from './router.js'

describe('LinkToRoute', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld display the loader and completed state', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <LinkToRoute
          route={
            {
              url: '/subroute/:id',
            } as Route<{ id: number }>
          }
          params={{ id: 123 }}
          id="route"
        >
          Link
        </LinkToRoute>
      ),
    })
    expect(document.body.innerHTML).toBe(
      '<div id="root"><a is="pi-rat-route-link" id="route" href="/subroute/123">Link</a></div>',
    )
  })
})
