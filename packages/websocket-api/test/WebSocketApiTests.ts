import { Injector } from '@furystack/inject'
import { using } from '@sensenet/client-utils'
import { WebSocketApi } from '../src/WebSocketApi'

describe('WebSocketApi', () => {
  it('Should be built', () => {
    const i = new Injector()
    const instance = i.setupInstance(WebSocketApi, {})
    expect(instance).toBeInstanceOf(WebSocketApi)
  })

  it('Should be activated and disposed', () => {
    using(new Injector(), i => {
      const instance = i.setupInstance(WebSocketApi, {})
      instance.activate()
    })
  })
})
