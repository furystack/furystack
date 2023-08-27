import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { useWebsockets } from './helpers'
import { WebSocketApiSettings } from '.'
import { describe, it, expect } from 'vitest'

describe('WebSocket Helpers', () => {
  it('Should register the settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i)
      expect(i.cachedSingletons.has(WebSocketApiSettings)).toBeTruthy()
    })
  })
})
