import { Injectable } from '@furystack/inject'
import { odataCollectionService } from '../templates.ts/collection-service'
import { entityPropertyTemplate } from '../templates.ts/EntityProperty'
import {
  odataCustomActionTemplate,
  odataCustomCollectionActionTemplate,
  odataCustomFunctionTemplate,
  odataCustomCollectionFunctionTemplate,
} from '../templates.ts/custom-actions-functions'
import { entityTypeTemplate } from '../templates.ts/EntityType'
import { odataContext } from '../templates.ts/odata-context'

/**
 * Model for configuring custom fetch behavior
 */
@Injectable({ lifetime: 'singleton' })
export class Configuration {
  /**
   * The Odata endpoint path
   */
  public path = 'http://localhost/odata'

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
  public writeDump? = true

  /**
   * A relative path to a current working director (e.g.: './metadata')
   */
  public outputPath = './odata-metadata'

  /**
   * A relative path (to outputPath) to store entity types
   */
  public entityTypePath = './entity-types'

  /**
   * A relative path (to outputPath) to store entity collection services
   */
  public entityCollectionServicesPath = './entity-collections'

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
   * Template for entity custom actions
   */
  public customActionTemplate = odataCustomActionTemplate

  /**
   * Template for collection-bound custom actions
   */
  public customCollectionActionsTemplate = odataCustomCollectionActionTemplate

  /**
   * Template for entity-related custom functions
   */
  public customFunctionTempalte = odataCustomFunctionTemplate

  /**
   * Template for collection-bound custom function
   */
  public customCollectionFunctionTemplate = odataCustomCollectionFunctionTemplate

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
        return `any /*original was '${edmType}' */`
      }
    }
  }

  /**
   * Generates the entity type model name (with namespace). By default, trims the namespace and returns the lower case entity name.
   * @param entityName The plain entity type name
   */

  public getModelFileName(entityName: string) {
    return entityName.split('.')[entityName.split('.').length - 1].toLowerCase()
  }

  /**
   * Generates the model name that will be used as a class / interface name. By default it trims the namespace, sanitizes the name and returns it capitalized.
   * @param entityName The plain entity name (with namespace)
   */
  public getModelName(entityName: string) {
    const sanitized = entityName.split('.')[entityName.split('.').length - 1].replace(/[^a-zA-Z0-9.-]/g, () => '_')
    return sanitized[0].toUpperCase() + sanitized.slice(1)
  }

  /**
   * Returns the service file's name (without the .ts extension) from the service, defaults to the collection name in lower case
   */
  public getServiceFileName(collectionName: string) {
    return collectionName.toLowerCase()
  }

  /**
   * Returns a class name from the collection name that will be used as the collection's name. By default, it trims namespaces and returns the capitalized class name.
   * @param collectionName The plain collection name with namespaces
   */
  public getServiceClassName(collectionName: string) {
    return (
      collectionName[0].toUpperCase() +
      collectionName
        .split('.')
        [collectionName.split('.').length - 1].toLowerCase()
        .slice(1)
    )
  }
}
