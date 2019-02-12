import { HttpUserContext } from '@furystack/http-api'
import { Constructable, Injectable } from '@furystack/inject'
import { createServer } from 'http'
import { Server } from 'net'

/**
 * A configuration object for FuryStack WebSocket API
 */
@Injectable()
export class WebSocketApiConfiguration {
  public Path: string = '/socket'
  public Server: Server = createServer()
  public PerActionServices: Array<Constructable<any>> = [HttpUserContext]
}
