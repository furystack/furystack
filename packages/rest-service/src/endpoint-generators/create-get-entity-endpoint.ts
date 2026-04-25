import type { DataSetToken } from '@furystack/repository'
import type { GetEntityEndpoint } from '@furystack/rest'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

/**
 * Creates a GET entity endpoint backed by the DataSet resolved from the
 * provided {@link DataSetToken}. Throws a 404 `RequestError` when the
 * entity cannot be found.
 */
export const createGetEntityEndpoint = <T extends object, TPrimaryKey extends keyof T>(
  dataSet: DataSetToken<T, TPrimaryKey>,
): RequestAction<GetEntityEndpoint<T, TPrimaryKey>> => {
  return async ({ injector, getUrlParams, getQuery }) => {
    const { id } = getUrlParams()
    const { select } = getQuery()
    const ds = injector.get(dataSet)
    const entry = await ds.get(injector, id, select)
    if (!entry) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(entry)
  }
}
