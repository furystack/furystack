import type { Disposable } from '@furystack/utils'
import type { Data } from 'ws'

/**
 * Static methods of a WebSocket Action
 */
export interface WebSocketActionStatic {
  canExecute(options: { data: Data }): boolean
}

/**
 * A WebSocket action implementaion
 */
export interface WebSocketAction extends Disposable {
  execute(options: { data: Data }): void
}
