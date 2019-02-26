import { Injector } from '@furystack/inject/dist/Injector'
import { WebSocketApiSettings } from './WebSocketApiSettings'

declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useWebsockets: (settings?: Partial<WebSocketApiSettings>) => Injector
  }
}

Injector.prototype.useWebsockets = function(settings) {
  const s = { ...new WebSocketApiSettings(), settings }
  this.setExplicitInstance(s, WebSocketApiSettings)
  return this
}
