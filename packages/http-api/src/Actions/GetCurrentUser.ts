import { ServerResponse } from 'http'
import { Injectable } from '@furystack/inject'
import { HttpUserContext } from '../HttpUserContext'
import { RequestAction } from '../Models'

/**
 * Action that returns the current authenticated user
 */
@Injectable({ lifetime: 'scoped' })
export class GetCurrentUser implements RequestAction {
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
  constructor(private serverResponse: ServerResponse, private userContext: HttpUserContext) {}
}
