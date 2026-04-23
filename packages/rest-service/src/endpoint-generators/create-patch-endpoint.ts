import type { WithOptionalId } from '@furystack/core'
import type { DataSetToken } from '@furystack/repository'
import type { PatchEndpoint } from '@furystack/rest'
import { readPostBody } from '../read-post-body.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

/**
 * Creates a PATCH endpoint that applies a partial update to an entity
 * identified by the URL's `:id` parameter. The DataSet is resolved from the
 * supplied {@link DataSetToken}.
 */
export const createPatchEndpoint = <
  T extends object,
  TPrimaryKey extends keyof T,
  TWritableData = WithOptionalId<T, TPrimaryKey>,
>(
  dataSet: DataSetToken<T, TPrimaryKey, TWritableData>,
): RequestAction<PatchEndpoint<T, TPrimaryKey, TWritableData>> => {
  return async ({ injector, request, getUrlParams }) => {
    const { id } = getUrlParams()
    const patchData = await readPostBody<T>(request)
    const ds = injector.get(dataSet)
    await ds.update(injector, id, patchData)
    return JsonResult({})
  }
}
