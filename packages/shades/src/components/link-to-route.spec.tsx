import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import { flushUpdates } from '../shade.js'
import { LinkToRoute } from './link-to-route.js'
import type { Route } from './router.js'

describe('LinkToRoute', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld display the loader and completed state', async () => {
    await usingAsync(new Injector(), async (injector) => {
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
      await flushUpdates()
      expect(document.body.innerHTML).toBe(
        '<div id="root"><a is="link-to-route" id="route" href="/subroute/123">Link</a></div>',
      )
    })
  })
})
