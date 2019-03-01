import { Constructable } from '@furystack/inject'
import { EdmType } from './edm-type'
import { ODataEntityAction } from './odata-entity-action'

/**
 * Generic model that defines an entity
 */
export interface Entity<T> {
  model: Constructable<T>
  name?: string
  actions: Array<Constructable<ODataEntityAction<T, any, any>>>
  functions: Array<Constructable<ODataEntityAction<T, any, any>>>
  primaryKey: keyof T
  fields: Array<{ property: keyof T; type: EdmType }>
  relations: Array<{ propertyName: string; foreignKey: keyof T; relatedModel: Constructable<any> }>
}
