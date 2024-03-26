import type { Disposable } from '@furystack/utils'
import type { Data, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'

/**
 * Static methods of a WebSocket Action
 */
export interface WebSocketActionStatic {
  canExecute(options: { data: Data; request: IncomingMessage; socket: WebSocket }): boolean
}

/**
 * A WebSocket action implementaion
 */
export interface WebSocketAction extends Disposable {
  execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }): void
}
