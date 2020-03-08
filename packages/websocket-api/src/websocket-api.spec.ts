import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { WebSocketApi } from './websocket-api'
import './injector-extensions'

describe('WebSocketApi', () => {
  it('Should be built', async () => {
    await usingAsync(new Injector(), async i => {
      i.useWebsockets({ port: 19998 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', async () => {
    await usingAsync(new Injector(), async i => {
      i.useWebsockets({ path: '/web-socket', port: 19996 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
})
