import { Constructable } from '@furystack/inject'
import { FunctionDescriptor } from './function-descriptor'

/**
 * Model that defines a Collection instance
 */
export interface Collection<T> {
  name: string
  model: Constructable<T>
  actions?: FunctionDescriptor[]
  functions?: FunctionDescriptor[]
}
