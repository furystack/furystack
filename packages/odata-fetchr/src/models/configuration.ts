import { Injectable } from '@furystack/inject'
import { entityPropertyTemplate } from '../templates.ts/EntityProperty'
import { entityTypeTemplate } from '../templates.ts/EntityType'
import { odataContext } from '../templates.ts/odata-context'
import { odataCollectionService } from '../templates.ts/collection-service'

/**
 * Model for configuring custom fetch behavior
 */
@Injectable({ lifetime: 'singleton' })
export class Configuration {
  /**
   * The Odata endpoint path
   */
  public path: string = 'http://localhost/odata'

  /**
   * Async method that returns the Metadata XML in a plain String format
   *
   */
  public getMetadataXml: () => Promise<string> = () => {
    throw Error('getMetadataXml not configured!')
  }

  /**
   * Dumps the endpoint to a "dump.json" file
   */
  public writeDump?: boolean = true

  /**
   * A relative path to a current working director (e.g.: './metadata')
   */
  public outputPath: string = './metadata'

  /**
   * A relative path (to outputPath) to store entity types
   */
  public entityTypePath: string = './entity-types'

  /**
   * A relative path (to outputPath) to store entity collection services
   */
  public entityCollectionServicesPath: string = './entity-collections'

  /**
   * The template for Entity Types
   */
  public entityTypeTemplate: string = entityTypeTemplate

  /**
   * The template for Entity Properties
   */
  public entityPropertyTemplate: string = entityPropertyTemplate

  /**
   * The template for the Odata Context Model
   */
  public odataContextTemplate: string = odataContext

  /**
   * Template for entity collection services
   */
  public odataCollectionServiceTemplate: string = odataCollectionService

  /**
   * Returns a meaningful type from an EDM Type string
   * @param edmType the plain EDM Type string
   */
  public resolveEdmType(edmType: string) {
    switch (edmType) {
      case 'Edm.String':
      case 'Edm.Duration':
      case 'Edm.Guid':
      case 'Edm.Binary':
        return 'string'
      case 'Edm.Int16':
      case 'Edm.Int32':
      case 'Edm.Int64':
      case 'Edm.Double':
      case 'Edm.Decimal':
        return 'number'
      case 'Edm.Boolean':
        return 'boolean'
      case 'Edm.DateTimeOffset':
        return 'Date'
      default: {
        return `any // original EDM type was: ${edmType}`
      }
    }
  }
}
