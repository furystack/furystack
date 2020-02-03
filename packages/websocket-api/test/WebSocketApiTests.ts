import { WebSocketApi } from '../src'
import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'

describe('WebSocketApi', () => {
  it('Should be built', () => {
    using(new Injector(), i => {
      i.useWebsockets()
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', () => {
    using(new Injector(), i => {
      i.useWebsockets({ path: '/web-socket' })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
})
