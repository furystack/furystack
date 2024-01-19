import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { useWebsockets } from './helpers.js'
import { describe, it, expect } from 'vitest'
import { WebSocketApiSettings } from './websocket-api-settings.js'
import { getPort } from '@furystack/core/port-generator'

describe('WebSocket Helpers', () => {
  it('Should register the settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      const port = getPort()
      useWebsockets(i, { port })
      const settings = i.getInstance(WebSocketApiSettings)
      expect(settings.port).toBe(port)
      expect(settings.path).toBe('/socket')
    })
  })
})
