import { Injectable, Injected } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'
import type { WebSocketAction } from '../models/websocket-action.js'

/**
 * Example action that returns the current user instance
 */
@Injectable({ lifetime: 'transient' })
export class WhoAmI implements WebSocketAction {
  public [Symbol.dispose]() {
    /** */
  }
  public static canExecute(options: { data: Data; request: IncomingMessage }): boolean {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const stringifiedValue: string = options.data.toString()

    return stringifiedValue === 'whoami' || stringifiedValue === 'whoami /claims'
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
  declare private readonly httpUserContext: HttpUserContext
}
