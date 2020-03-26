import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import './injector-extensions'
import { WebSocketApi, WebSocketApiSettings } from '.'

describe('WebSocket injector extensions', () => {
  it('Should extend the Injector', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(typeof i.useWebsockets).toBe('function')
    })
  })

  it('Should register the related services', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useWebsockets()
      expect(i.cachedSingletons.has(WebSocketApiSettings)).toBeTruthy()
      expect(i.cachedSingletons.has(WebSocketApi)).toBeTruthy()
    })
  })
})
