import { HttpUserContext } from '@furystack/rest-service'
import { Injectable, Injected } from '@furystack/inject'
import type { Data } from 'ws'
import ws from 'ws'
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

  public async execute(options: { data: Data; request: IncomingMessage }) {
    try {
      const currentUser = await this.httpUserContext.getCurrentUser(options.request)
      this.websocket.send(JSON.stringify({ currentUser }))
    } catch (error) {
      this.websocket.send(JSON.stringify({ currentUser: null }))
    }
  }

  @Injected(HttpUserContext)
  private readonly httpUserContext!: HttpUserContext

  @Injected(ws)
  private readonly websocket!: ws
}
