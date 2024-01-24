import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { WhoAmI } from './actions/whoami.js'
import type { WebSocketAction, WebSocketActionStatic } from './models/websocket-action.js'

/**
 * A configuration object for FuryStack WebSocket API
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApiSettings {
  public port = 80
  public host?: string
  public path = '/socket'
  public actions: Array<Constructable<WebSocketAction> & WebSocketActionStatic> = [WhoAmI]
}
