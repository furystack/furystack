import { Injectable } from '@furystack/inject'
import { EntitySet, EntityType, OdataAction, OdataEndpoint, OdataFunction } from './models'

/**
 * method that parses an OData XML to an Endpoint model
 * @param xml the XML document
 */
@Injectable({ lifetime: 'transient' })
export class MetadataParser {
  public parseActions(xml: Document) {
    return Array.from(xml.querySelectorAll('Action').values()).map(a => {
      const returnType = a.querySelector('ReturnType')
      const value: OdataAction = {
        name: a.getAttribute('Name') || 'UnknownAction',
        function: a.getAttribute('Function') || 'UnknownAction',
        isBound: a.getAttribute('IsBound') === 'true',
        parameters: Array.from(a.querySelectorAll('Parameter')).map(param => ({
          type: param.getAttribute('Type') || 'UnknownType',
          name: param.getAttribute('Name') || 'UnknownName',
        })),
        ...(returnType ? { returnType: returnType.getAttribute('Type') || 'Unknown' } : {}),
      }
      return value
    })
  }

  public parseFunctions(xml: Document) {
    return Array.from(xml.querySelectorAll('Function').values()).map(a => {
      const returnType = a.querySelector('ReturnType')
      const value: OdataFunction = {
        name: a.getAttribute('Name') || 'UnknownName',
        function: a.getAttribute('Function') || 'UnknownFunction',
        isBound: a.getAttribute('IsBound') === 'true',
        parameters: Array.from(a.querySelectorAll('Parameter')).map(param => ({
          type: param.getAttribute('Type') || 'UnknownType',
          name: param.getAttribute('Name') || 'UnknownName',
        })),
        ...(returnType ? { returnType: returnType.getAttribute('Type') || 'Uknown' } : { returnType: 'Unknown' }),
      }
      return value
    })
  }

  public parseEntityTypes(xml: Document) {
    return Array.from(xml.querySelectorAll('EntityType').values()).map(e => {
      const key = e.querySelector('Key>PropertyRef')
      const value: EntityType = {
        name: e.getAttribute('Name') || 'UnknownName',
        key: (key && key.getAttribute('Name')) || 'UnknownKey',
        properties: Array.from(e.querySelectorAll('Property')).map(prop => ({
          name: prop.getAttribute('Name') || 'UnknownName',
          nullable: prop.getAttribute('Nullable') === 'true',
          type: prop.getAttribute('Type') || 'UnknownType',
        })),
        navigationProperties: Array.from(e.querySelectorAll('NavigationProperty')).map(prop => ({
          name: prop.getAttribute('Name') || 'UnknownName',
          type: prop.getAttribute('Type') || 'UnknownType',
        })),
      }
      return value
    })
  }

  public parseEntitySets(xml: Document) {
    return Array.from(xml.querySelectorAll('EntitySet')).map(e => {
      const value: EntitySet = {
        name: e.getAttribute('Name') || 'UnknownName',
        entityType: e.getAttribute('EntityType') || 'UnknownType',
      }
      return value
    })
  }

  public parseMetadataXml(xml: Document, path: string): OdataEndpoint {
    return {
      path,
      entityTypes: this.parseEntityTypes(xml),
      entitySets: this.parseEntitySets(xml),
      actions: this.parseActions(xml),
      functions: this.parseFunctions(xml),
    }
  }
}
