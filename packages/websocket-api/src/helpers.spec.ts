import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useWebsockets } from './helpers.js'
import { WebSocketApiSettings } from './websocket-api-settings.js'

describe('WebSocket Helpers', () => {
  it('Should register the settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      const port = getPort()
      await useWebsockets(i, { port })
      const settings = i.getInstance(WebSocketApiSettings)
      expect(settings.port).toBe(port)
      expect(settings.path).toBe('/socket')
    })
  })
})
