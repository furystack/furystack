import { HttpUserContext } from '@furystack/rest-service'
import { Injectable } from '@furystack/inject'
import ws, { Data } from 'ws'
import { WebSocketAction } from '../models/websocket-action'

/**
 * Example action that returns the current user instance
 */
@Injectable({ lifetime: 'transient' })
export class WhoAmI implements WebSocketAction {
  public dispose() {
    /** */
  }
  public static canExecute(data: Data): boolean {
    return data.toString() === 'whoami' || data.toString() === 'whoami /claims'
  }

  public async execute() {
    try {
      const currentUser = await this.httpUserContext.getCurrentUser()
      this.websocket.send(JSON.stringify({ currentUser }))
    } catch (error) {
      this.websocket.send(JSON.stringify({ currentUser: null }))
    }
  }

  constructor(private httpUserContext: HttpUserContext, private websocket: ws) {}
}
