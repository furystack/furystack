import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { WhoAmI } from './actions/whoami'
import type { WebSocketAction, WebSocketActionStatic } from '.'

/**
 * A configuration object for FuryStack WebSocket API
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApiSettings {
  public port = 19090
  public host?: string
  public path = '/socket'
  public actions: Array<Constructable<WebSocketAction> & WebSocketActionStatic> = [WhoAmI]
}
