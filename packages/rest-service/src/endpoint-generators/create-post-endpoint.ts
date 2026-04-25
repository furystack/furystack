import type { WithOptionalId } from '@furystack/core'
import type { DataSetToken } from '@furystack/repository'
import type { PostEndpoint } from '@furystack/rest'
import { RequestError } from '@furystack/rest'
import { readPostBody } from '../read-post-body.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

/**
 * Creates a POST endpoint that inserts a new entity into the DataSet
 * resolved from `dataSet`. Returns `201 Created` on success; throws a
 * `RequestError(404)` when the underlying store returns no created entity.
 */
export const createPostEndpoint = <
  T extends object,
  TPrimaryKey extends keyof T,
  TWritableData = WithOptionalId<T, TPrimaryKey>,
>(
  dataSet: DataSetToken<T, TPrimaryKey, TWritableData>,
): RequestAction<PostEndpoint<T, TPrimaryKey, TWritableData>> => {
  return async ({ injector, request }) => {
    const ds = injector.get(dataSet)
    const entityToCreate = await readPostBody<TWritableData>(request)
    const { created } = await ds.add(injector, entityToCreate)
    if (!created || !created.length) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(created[0], 201)
  }
}
