import { WhoAmI } from './Actions/Whoami'
import { WebSocketAction, WebSocketActionStatic } from '.'
import { Constructable } from '@furystack/inject'

/**
 * A configuration object for FuryStack WebSocket API
 */
export class WebSocketApiSettings {
  public path = '/socket'
  public actions: Array<Constructable<WebSocketAction> & WebSocketActionStatic> = [WhoAmI]
}
