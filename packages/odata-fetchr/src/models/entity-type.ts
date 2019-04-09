import { EntityProperty } from './entity-property'

/**
 * Defines an entity type model
 */
export interface EntityType {
  /**
   * The field used as primary key
   */
  key: string

  /**
   * Name of the Entity Type
   */
  name: string

  /**
   * Property definitions
   */
  properties?: EntityProperty[]

  /**
   * Navigation property definitions
   */
  navigationProperties?: Array<{ type: string }>
}
