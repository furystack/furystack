import { Disposable } from '@furystack/utils'
import { Data } from 'ws'

/**
 * Static methods of a WebSocket Action
 */
export interface WebSocketActionStatic {
  canExecute(data: Data): boolean
}

/**
 * A WebSocket action implementaion
 */
export interface WebSocketAction extends Disposable {
  execute(data: Data): void
}
