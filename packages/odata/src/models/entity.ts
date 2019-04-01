import { IRequestAction } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
import { EdmType } from './edm-type'

/**
 * Generic model that defines an entity
 */
export interface Entity<T> {
  model: Constructable<T>
  name?: string
  actions: Array<Constructable<IRequestAction>>
  functions: Array<Constructable<IRequestAction>>
  primaryKey: keyof T
  fields: Array<{ property: keyof T; type: EdmType }>
  relations: Array<{ propertyName: string; foreignKey: keyof T; relatedModel: Constructable<any> }>
}
