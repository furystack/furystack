import { HttpUserContext } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
import { IWebSocketAction, IWebSocketActionStatic } from '.'

/**
 * A configuration object for FuryStack WebSocket API
 */
export class WebSocketApiSettings {
  public path: string = '/socket'
  public perActionServices: Array<Constructable<any>> = [HttpUserContext]
  public actions: Array<Constructable<IWebSocketAction> & IWebSocketActionStatic> = []
}
