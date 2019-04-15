import { Entity } from '../models/entity'
import { Collection } from '../models/collection'
import { FunctionDescriptor } from '../models/function-descriptor'

/**
 * Interface for options object for Router factories
 */
export interface RouterOptions {
  route: string
  entities: Array<Entity<any>>
  collections: Array<Collection<any>>
  globalActions: FunctionDescriptor[]
  globalFunctions: FunctionDescriptor[]
}
