import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { useWebsockets } from './helpers.js'
import { describe, it, expect } from 'vitest'
import { WebSocketApiSettings } from './websocket-api-settings.js'

describe('WebSocket Helpers', () => {
  it('Should register the settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i)
      expect(i.cachedSingletons.has(WebSocketApiSettings)).toBeTruthy()
    })
  })
})
