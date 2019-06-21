import { User } from '@furystack/core'
import { HttpUserContext } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import ws, { Data } from 'ws'
import { WebSocketAction } from '../models/WebSocketAction'

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
    const currentUser = await this.httpUserContext.getCurrentUser()
    this.websocket.send(JSON.stringify(currentUser))
  }

  constructor(private httpUserContext: HttpUserContext<User>, private websocket: ws) {}
}
