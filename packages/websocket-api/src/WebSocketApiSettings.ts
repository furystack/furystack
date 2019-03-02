import { Constructable } from '@furystack/inject'
import { IWebSocketAction, IWebSocketActionStatic } from '.'
import { WhoAmI } from './Actions/Whoami'

/**
 * A configuration object for FuryStack WebSocket API
 */
export class WebSocketApiSettings {
  public path: string = '/socket'
  public actions: Array<Constructable<IWebSocketAction> & IWebSocketActionStatic> = [WhoAmI]
}
