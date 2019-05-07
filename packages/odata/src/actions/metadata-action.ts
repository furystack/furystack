import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { ModelBuilder } from '../model-builder'
import { xmlToString } from '../xml-utils'

/**
 * OData Metadata action
 */
@Injectable({ lifetime: 'transient' })
export class MetadataAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const xml = xmlToString(this.model.toXmlNode())
    this.response.setHeader('Content-Type', 'application/xml;charset=utf-8')
    this.response.setHeader('Cache-Control', 'no-cache')
    this.response.end(`<?xml version="1.0" encoding="utf-8"?>${xml}`)
  }
  constructor(private model: ModelBuilder, public incomingMessage: IncomingMessage, public response: ServerResponse) {}
}
