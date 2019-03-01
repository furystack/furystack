import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { ModelBuilder } from '../model-builder'
import { xmlToString } from '../xml-utils'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class MetadataAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const xml = xmlToString(this.model.toXmlNode())
    this.response.setHeader('content-type', 'application/xml')
    this.response.end(xml)
  }
  constructor(private model: ModelBuilder, public incomingMessage: IncomingMessage, public response: ServerResponse) {}
}
