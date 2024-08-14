import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'

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
  execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }): Promise<void>
}
