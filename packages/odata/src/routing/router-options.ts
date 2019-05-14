import { Collection } from '../models/collection'
import { Entity } from '../models/entity'
import { FunctionDescriptor } from '../models/function-descriptor'

/**
 * Interface for options object for Router factories
 */
export interface RouterOptions {
  /**
   * Name of the default OData Route
   */
  route: string

  /**
   * Entity definitions
   */
  entities: Array<Entity<any>>

  /**
   * Collection definitions
   */
  collections: Array<Collection<any>>

  /**
   * Global Action definitions
   */
  globalActions: FunctionDescriptor[]

  /**
   * Global Function definitions
   */
  globalFunctions: FunctionDescriptor[]
}
