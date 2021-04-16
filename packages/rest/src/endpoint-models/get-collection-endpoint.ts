import { PartialResult, FindOptions } from '@furystack/core'

/**
 * Response Model for GetCollection
 */
export type GetCollectionResult<T, TFields extends Array<keyof T>> = {
  /**
   * The Total count of entities
   */
  count: number
  /**
   * List of the selected entities
   */
  entries: Array<PartialResult<T, TFields>>
}

/**
 * Rest endpoint model for getting / querying collections
 */
export type GetCollectionEndpoint<T> = {
  query: { findOptions?: FindOptions<T, Array<keyof T>> }
  result: GetCollectionResult<T, Array<keyof T>>
}
