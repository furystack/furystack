import { IUser } from '@furystack/core'
import { HttpUserContext } from '@furystack/http-api'
import { Data } from 'ws'
import { IWebSocketAction } from '../models/IWebSocketAction'
import * as ws from 'ws'

/**
 * Example action that returns the current user instance
 */
export class WhoAmI implements IWebSocketAction {
  public dispose() {
    /** */
  }
  public static canExecute(data: Data): boolean {
    return data.toString() === 'whoami' || data.toString() === 'whoami /claims'
  }

  public async execute() {
    const currentUser = await this.httpUserContext.getCurrentUser()
    this.ws.send(currentUser)
  }

  constructor(private httpUserContext: HttpUserContext<IUser>, private ws: ws) {}
}
