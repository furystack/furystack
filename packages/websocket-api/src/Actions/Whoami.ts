import { IUser } from '@furystack/core'
import { HttpUserContext } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { Data } from 'ws'
import * as ws from 'ws'
import { IWebSocketAction } from '../models/IWebSocketAction'

/**
 * Example action that returns the current user instance
 */
@Injectable()
export class WhoAmI implements IWebSocketAction {
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

  constructor(private httpUserContext: HttpUserContext<IUser>, private websocket: ws) {}
}
