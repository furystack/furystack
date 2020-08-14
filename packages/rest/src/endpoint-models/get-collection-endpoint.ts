import { PartialResult, FindOptions } from '@furystack/core'
import { RequestAction } from '../request-action'

/**
 * Rest endpoint model for getting / querying collections
 */
export type GetCollectionEndpoint<T> = RequestAction<{
  query: { findOptions: FindOptions<T, Array<keyof T>> }
  result: { count: number; entries: Array<PartialResult<T, any>> }
}>
