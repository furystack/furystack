import { Constructable } from '@furystack/inject'
import { EdmType } from './edm-type'
import { FunctionDescriptor } from './function-descriptor'

/**
 * Generic model that defines an entity
 */
export interface Entity<T> {
  model: Constructable<T>
  name?: string
  actions?: { [k: string]: FunctionDescriptor }
  functions?: { [k: string]: FunctionDescriptor }
  primaryKey: keyof T
  fields: Array<{ property: keyof T; type: EdmType }>
  relations?: Array<{ propertyName: string; foreignKey: keyof T; relatedModel: Constructable<any> }>
}
