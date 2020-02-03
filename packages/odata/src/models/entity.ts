import { EdmType } from './edm-type'
import { FunctionDescriptor } from './function-descriptor'
import { NavigationProperty, NavigationPropertyCollection } from './navigation-property'
import { Constructable } from '@furystack/inject'

/**
 * An OData Entity definition
 */
export interface Entity<T> {
  /**
   * The constructable model
   */
  model: Constructable<T>
  /**
   * Name of the entity (e.g.: 'User')
   */
  name?: string
  /**
   * Optional list of the custom actions that can be executed on the entity (e.g. 'tasks/assign')
   */
  actions?: FunctionDescriptor[]

  /**
   * Optional list of the custom actions that can be executed on the entity (e.g. 'tasks/getAssignee')
   */
  functions?: FunctionDescriptor[]

  /**
   * The primary key field name
   */
  primaryKey: keyof T

  /**
   * List of properties that are available through OData
   */
  properties: Array<{ property: keyof T; type: EdmType; nullable?: boolean }>

  /**
   * List of navigation properties that points to a single entity
   */
  navigationProperties?: Array<NavigationProperty<T, unknown>>

  /**
   * List of navigation properties that points to an entity collection
   */
  navigationPropertyCollections?: Array<NavigationPropertyCollection<T, unknown>>
}
