import { HttpUserContext } from '@furystack/rest-service'
import { Injectable, Injected } from '@furystack/inject'
import type { Data, WebSocket } from 'ws'
import type { WebSocketAction } from '../models/websocket-action.js'
import type { IncomingMessage } from 'http'

/**
 * Example action that returns the current user instance
 */
@Injectable({ lifetime: 'transient' })
export class WhoAmI implements WebSocketAction {
  public dispose() {
    /** */
  }
  public static canExecute(options: { data: Data; request: IncomingMessage }): boolean {
    return options.data.toString() === 'whoami' || options.data.toString() === 'whoami /claims'
  }

  public async execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }) {
    try {
      const currentUser = await this.httpUserContext.getCurrentUser(options.request)
      options.socket.send(JSON.stringify({ currentUser }))
    } catch (error) {
      options.socket.send(JSON.stringify({ currentUser: null }))
    }
  }

  @Injected(HttpUserContext)
  private declare readonly httpUserContext: HttpUserContext
}
