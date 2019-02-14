import { UserContext } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { ServerResponse } from 'http'
import { IRequestAction } from '../Models'

/**
 * Action that returns the current authenticated user
 */
@Injectable()
export class GetCurrentUser implements IRequestAction {
  public dispose() {
    /**  */
  }
  public async exec(): Promise<void> {
    const user = await this.userContext.getCurrentUser()
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify(user))
  }
  /**
   *
   */
  constructor(private serverResponse: ServerResponse, private userContext: UserContext) {}
}
