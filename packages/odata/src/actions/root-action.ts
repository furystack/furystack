import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { ServerResponse } from 'http'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class RootAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    this.resp.end(JSON.stringify({ action: 'root' }))
  }

  /**
   *
   */
  constructor(private resp: ServerResponse) {}
}
