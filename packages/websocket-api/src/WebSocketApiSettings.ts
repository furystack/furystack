import { HttpUserContext } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
import { createServer } from 'http'
import { Server } from 'net'

/**
 * A configuration object for FuryStack WebSocket API
 */
export interface WebSocketApiSettings {
  path: string
  server: Server
  perActionServices: Array<Constructable<any>>
}

/**
 * default settings for WebSocket API
 */
export const defaultWebSocketApiSettings: WebSocketApiSettings = {
  path: '/socket',
  server: createServer(),
  perActionServices: [HttpUserContext],
}
