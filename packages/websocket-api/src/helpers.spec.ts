import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { useWebsockets } from './helpers.js'

import { describe, expect, it } from 'vitest'
import { WebSocketApiSettings } from './websocket-api-settings.js'
import { WebSocketApi } from './websocket-api.js'

describe('WebSocket Helpers', () => {
  it('Should register the related services', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i)
      expect(i.cachedSingletons.has(WebSocketApiSettings)).toBeTruthy()
      expect(i.cachedSingletons.has(WebSocketApi)).toBeTruthy()
    })
  })
})
