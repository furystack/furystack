import { Disposable } from '@furystack/utils'
import { Data } from 'ws'
import { IncomingMessage } from 'http'

/**
 * Static methods of a WebSocket Action
 */
export interface WebSocketActionStatic {
  canExecute(options: { data: Data; request: IncomingMessage }): boolean
}

/**
 * A WebSocket action implementaion
 */
export interface WebSocketAction extends Disposable {
  execute(options: { data: Data; request: IncomingMessage }): void
}
