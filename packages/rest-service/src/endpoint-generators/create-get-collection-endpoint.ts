import type { DataSetToken } from '@furystack/repository'
import type { GetCollectionEndpoint } from '@furystack/rest'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

/**
 * Creates a GetCollection endpoint backed by the DataSet resolved from the
 * provided {@link DataSetToken}. The token carries the entity model and
 * primary key, so callers no longer need to pass them separately.
 *
 * @example
 * ```ts
 * const endpoint = createGetCollectionEndpoint(UserDataSet)
 * ```
 */
export const createGetCollectionEndpoint = <T, TPrimaryKey extends keyof T>(
  dataSet: DataSetToken<T, TPrimaryKey>,
): RequestAction<GetCollectionEndpoint<T>> => {
  return async ({ injector, getQuery }) => {
    const { findOptions } = getQuery()
    const ds = injector.get(dataSet)
    const entriesPromise = ds.find(injector, findOptions || {})
    const countPromise = ds.count(injector, findOptions?.filter)
    const [entries, count] = await Promise.all([entriesPromise, countPromise])
    return JsonResult({ entries, count })
  }
}
