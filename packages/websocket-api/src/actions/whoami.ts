import { HttpUserContext } from '@furystack/rest-service'
import { Injectable } from '@furystack/inject'
import ws, { Data } from 'ws'
import { WebSocketAction } from '../models/websocket-action'
import { IncomingMessage } from 'http'

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

  constructor(private httpUserContext: HttpUserContext, private websocket: ws) {}
}
