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
    const stringifiedValue =
      typeof options.data === 'string'
        ? options.data
        : options.data instanceof Buffer
          ? options.data.toString()
          : options.data instanceof ArrayBuffer
            ? Buffer.from(options.data).toString()
            : options.data.map((buf) => buf.toString()).join('')

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
  private declare readonly httpUserContext: HttpUserContext
}
