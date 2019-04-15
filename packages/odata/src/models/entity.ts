import { Constructable } from '@furystack/inject'
import { EdmType } from './edm-type'
import { FunctionDescriptor } from './function-descriptor'
import { NavigationProperty, NavigationPropertyCollection } from './navigation-property'

/**
 * Generic model that defines an entity
 */
export interface Entity<T> {
  model: Constructable<T>
  name?: string
  actions?: FunctionDescriptor[]
  functions?: FunctionDescriptor[]
  primaryKey: keyof T
  properties: Array<{ property: keyof T; type: EdmType; nullable?: boolean }>
  navigationProperties?: Array<NavigationProperty<T, any>>
  navigationPropertyCollections?: Array<NavigationPropertyCollection<T, any>>
}
