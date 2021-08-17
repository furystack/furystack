import { Injector } from '@furystack/inject/dist/esm/injector'
import { WebSocketApi } from './websocket-api'
import { WebSocketApiSettings } from './websocket-api-settings'

declare module '@furystack/inject/dist/esm/injector' {
  /**
   * Defines an extended Injector instance
   */
  export interface Injector {
    /**
     * Registers a WebSocket API on a current injector instance.
     * Usage example:
     * ````ts
     * injector.useWebsockets({
     *    path: "/sockets",
     *    actions: [...my custom actions]
     * })
     * ````
     */
    useWebsockets: (settings?: Partial<WebSocketApiSettings>) => this
  }
}

Injector.prototype.useWebsockets = function (settings) {
  const s = { ...new WebSocketApiSettings(), ...settings }
  this.setExplicitInstance(s, WebSocketApiSettings)
  this.getInstance(WebSocketApi)
  return this
}
