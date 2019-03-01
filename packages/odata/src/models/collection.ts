import { Constructable } from '@furystack/inject'
import { ODataCollectionAction } from './odata-collection-action'

/**
 * Model that defines a Collection instance
 */
export interface Collection<T> {
  name: string
  model: Constructable<T>
  actions: Array<Constructable<ODataCollectionAction<T, any, any>>>
  functions: Array<Constructable<ODataCollectionAction<T, any, any>>>
}
