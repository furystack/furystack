import { RequestAction, XmlResult } from '@furystack/http-api'
import { ModelBuilder } from '../model-builder'
import { xmlToString } from '../xml-utils'

/**
 * OData Metadata action
 */
export const MetadataAction: RequestAction = async injector => {
  const model = injector.getInstance(ModelBuilder)
  const xml = xmlToString(model.toXmlNode())
  return XmlResult(`<?xml version="1.0" encoding="utf-8"?>${xml}`, undefined, {
    'Cache-Control': 'no-cache',
  })
}
