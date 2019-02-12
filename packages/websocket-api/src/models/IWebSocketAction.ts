import { Disposable } from '@sensenet/client-utils'
import { Data } from 'ws'

/**
 * Static methods of a WebSocket Action
 */
export interface IWebSocketActionStatic {
  canExecute(data: Data): boolean
}

/**
 * A WebSocket action implementaion
 */
export interface IWebSocketAction extends Disposable {
  new: (...args: any[]) => IWebSocketActionStatic
  authenticate: boolean
  authorize: string[]
  execute(data: Data): void
}
