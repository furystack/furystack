import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { ModelBuilder } from '../model-builder'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class GetCollectionAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    this.response.end(JSON.stringify({ name: 'GetCollection' }))
  }
  constructor(public model: ModelBuilder, public incomingMessage: IncomingMessage, public response: ServerResponse) {}
}
