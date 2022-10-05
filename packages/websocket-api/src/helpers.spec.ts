import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { useWebsockets } from './helpers'
import { WebSocketApi, WebSocketApiSettings } from '.'
import { describe, expect, it } from 'vitest'

describe('WebSocket Helpers', () => {
  it('Should register the related services', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i)
      expect(i.cachedSingletons.has(WebSocketApiSettings)).toBeTruthy()
      expect(i.cachedSingletons.has(WebSocketApi)).toBeTruthy()
    })
  })
})
