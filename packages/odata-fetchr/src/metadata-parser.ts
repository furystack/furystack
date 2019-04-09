import { Injectable } from '@furystack/inject'
import { EntitySet, EntityType, OdataAction, OdataEndpoint, OdataFunction, OdataParameter } from './models'

/**
 * method that parses an OData XML to an Endpoint model
 * @param xml the XML document
 */
@Injectable({ lifetime: 'transient' })
export class MetadataParser {
  public parseActions(xml: Document) {
    return Array.from(xml.querySelectorAll('Action').values()).map(a => {
      const returnType = a.querySelector('ReturnType')
      return {
        name: a.getAttribute('Name'),
        function: a.getAttribute('Function'),
        isBound: Boolean(a.getAttribute('IsBound')),
        parameters: Array.from(a.querySelectorAll('Parameter')).map(
          param => ({ type: param.getAttribute('Type'), name: param.getAttribute('Name') } as OdataParameter),
        ),
        ...(returnType ? { returnType: returnType.getAttribute('Type') } : {}),
      } as OdataAction
    })
  }

  public parseFunctions(xml: Document) {
    return Array.from(xml.querySelectorAll('Function').values()).map(a => {
      const returnType = a.querySelector('ReturnType')
      return {
        name: a.getAttribute('Name'),
        function: a.getAttribute('Function'),
        isBound: Boolean(a.getAttribute('IsBound')),
        parameters: Array.from(a.querySelectorAll('Parameter')).map(
          param => ({ type: param.getAttribute('Type'), name: param.getAttribute('Name') } as OdataParameter),
        ),
        ...(returnType ? { returnType: returnType.getAttribute('Type') } : {}),
      } as OdataFunction
    })
  }

  public parseEntityTypes(xml: Document) {
    return Array.from(xml.querySelectorAll('EntityType').values()).map(e => {
      const key = e.querySelector('Key>PropertyRef')
      return {
        name: e.getAttribute('Name'),
        key: key && key.getAttribute('Name'),
        properties: Array.from(e.querySelectorAll('Property')).map(prop => ({
          name: prop.getAttribute('Name'),
          nullable: Boolean(prop.getAttribute('Nullable')),
          type: prop.getAttribute('Type'),
        })),
        navigationProperties: Array.from(e.querySelectorAll('NavigationProperty')).map(prop => ({
          name: prop.getAttribute('Name'),
          type: prop.getAttribute('Type'),
        })),
      } as EntityType
    })
  }

  public parseEntitySets(xml: Document) {
    return Array.from(xml.querySelectorAll('EntitySet')).map(e => {
      return {
        name: e.getAttribute('Name'),
        entityType: e.getAttribute('EntityType'),
      } as EntitySet
    })
  }

  public parseMetadataXml(xml: Document) {
    return {
      entityTypes: this.parseEntityTypes(xml),
      entitySets: this.parseEntitySets(xml),
      actions: this.parseActions(xml),
      functions: this.parseFunctions(xml),
    } as OdataEndpoint
  }
}
