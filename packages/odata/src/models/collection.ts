import { Constructable } from '@furystack/inject'
import { FunctionDescriptor } from './function-descriptor'

/**
 * Defines an OData Collection
 */
export interface Collection<T> {
  /**
   * Name of the collection (e.g. 'users')
   */
  name: string
  /**
   * Constructable model
   */
  model: Constructable<T>
  /**
   * Optional list of the custom actions that can be executed on the collection (e.g. 'tasks/completeAll')
   */
  actions?: FunctionDescriptor[]

  /**
   * Optional list of the custom functions that can be executed on the collection (e.g. 'users/current')
   */
  functions?: FunctionDescriptor[]
}
