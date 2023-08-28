import type { Injector } from '@furystack/inject'
import { WebSocketApi } from './websocket-api.js'
import { WebSocketApiSettings } from './websocket-api-settings.js'

/**
 * Registers a WebSocket API on a current injector instance.
 * Usage example:
 * ````ts
 * injector.useWebsockets({
 * path: "/sockets",
 * actions: [...my custom actions]
 * })
 * ````
 * @param injector The injector instance
 * @param settings The Settings object for the WebSocket API
 */
export const useWebsockets = (injector: Injector, settings?: Partial<WebSocketApiSettings>) => {
  const s = new WebSocketApiSettings()
  Object.assign(s, settings)
  injector.setExplicitInstance(s, WebSocketApiSettings)
  injector.getInstance(WebSocketApi)
}
