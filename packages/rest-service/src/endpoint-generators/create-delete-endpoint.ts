import type { DataSetToken } from '@furystack/repository'
import type { DeleteEndpoint } from '@furystack/rest'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

/**
 * Creates a DELETE endpoint that removes the entity identified by the URL's
 * `:id` parameter. Returns `204 No Content` once the removal has been
 * persisted to the underlying store.
 */
export const createDeleteEndpoint = <T extends object, TPrimaryKey extends keyof T>(
  dataSet: DataSetToken<T, TPrimaryKey>,
): RequestAction<DeleteEndpoint<T, TPrimaryKey>> => {
  return async ({ injector, getUrlParams }) => {
    const { id } = getUrlParams()
    const ds = injector.get(dataSet)
    await ds.remove(injector, id)
    return JsonResult({}, 204)
  }
}
