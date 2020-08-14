import { PartialResult, FindOptions } from '@furystack/core'
import { RequestAction } from '../request-action'

/**
 * Response Model for GetCollection
 */
export type GetCollectionResult<T, TFields extends keyof T> = {
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
export type GetCollectionEndpoint<T> = RequestAction<{
  query: { findOptions?: FindOptions<T, Array<keyof T>> }
  result: GetCollectionResult<T, keyof T>
}>
