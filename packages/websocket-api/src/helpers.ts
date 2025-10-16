import type { Injector } from '@furystack/inject'
import { WebSocketApiSettings } from './websocket-api-settings.js'
import { WebSocketApi } from './websocket-api.js'

/**
 * Registers a WebSocket API on a current injector instance.
 * Usage example:
 * ````ts
 * await injector.useWebsockets({
 * path: "/sockets",
 * actions: [...my custom actions]
 * })
 * ````
 * @param injector The injector instance
 * @param settings The Settings object for the WebSocket API
 */
export const useWebsockets = async (injector: Injector, settings?: Partial<WebSocketApiSettings>) => {
  const s = new WebSocketApiSettings()
  Object.assign(s, settings)
  injector.setExplicitInstance(s, WebSocketApiSettings)
  const api = injector.getInstance(WebSocketApi)
  await api.init()
}
