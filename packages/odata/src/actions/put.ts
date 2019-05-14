import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { ModelBuilder } from '../model-builder'

/**
 * OData Put action
 */
@Injectable({ lifetime: 'transient' })
export class PutAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    this.response.end(JSON.stringify({ name: 'Put' }))
  }
  constructor(public model: ModelBuilder, public incomingMessage: IncomingMessage, public response: ServerResponse) {}
}
