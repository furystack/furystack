import { Injector } from '@furystack/inject'
import { WebSocketApi } from '../src/WebSocketApi'

describe('WebSocketApi', () => {
  it('Should be built', () => {
    const i = new Injector()
    const instance = i.setupInstance(WebSocketApi, {})
    expect(instance).toBeInstanceOf(WebSocketApi)
  })
})
