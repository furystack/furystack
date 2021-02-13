import { PartialResult, FindOptions } from '@furystack/core'

/**
 * Endpoint model for getting a single entity
 */
export type GetEntityEndpoint<T> = {
  query: {
    /**
     * The list of fields to select
     */
    select: FindOptions<T, Array<keyof T>>['select']
  }
  url: {
    /**
     * The entity's unique identifier
     */
    id: T[keyof T]
  }
  result: PartialResult<T, any>
}
