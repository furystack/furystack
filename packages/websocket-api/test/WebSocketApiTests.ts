import { Injector } from '@furystack/inject'
import { WebSocketApi } from '../src/WebSocketApi'
import { WebSocketApiConfiguration } from '../src/WebSocketApiConfiguration'

describe('WebSocketApi', () => {
  it('Should be built', () => {
    const i = new Injector()
    i.setInstance({}, WebSocketApiConfiguration)
    const instance = i.getInstance(WebSocketApi)
    expect(instance).toBeInstanceOf(WebSocketApi)
  })
})
