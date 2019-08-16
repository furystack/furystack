import { Constructable } from '@furystack/inject'
import { WhoAmI } from './Actions/Whoami'
import { WebSocketAction, WebSocketActionStatic } from '.'

/**
 * A configuration object for FuryStack WebSocket API
 */
export class WebSocketApiSettings {
  public path = '/socket'
  public actions: Array<Constructable<WebSocketAction> & WebSocketActionStatic> = [WhoAmI]
}
