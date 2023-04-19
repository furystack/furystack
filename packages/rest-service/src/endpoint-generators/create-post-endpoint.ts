import type { Constructable } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { RequestError } from '@furystack/rest'
import '@furystack/repository'
import '../incoming-message-extensions'
import type { RequestAction } from '../request-action-implementation'
import { JsonResult } from '../request-action-implementation'
import type { WithOptionalId } from '@furystack/core'
import { getRepository } from '@furystack/repository'
/**
 * Creates a POST endpoint for updating entities
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field name used as primary key
 * @returns a boolean that indicates the success
 */
export const createPostEndpoint = <
  T extends object,
  TPrimaryKey extends keyof T,
  TWritableData = WithOptionalId<T, TPrimaryKey>,
>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<PostEndpoint<T, TPrimaryKey, TWritableData>> = async ({ injector, request }) => {
    const dataSet = getRepository(injector).getDataSetFor<T, TPrimaryKey, TWritableData>(
      options.model,
      options.primaryKey,
    )

    const entityToCreate = await request.readPostBody<TWritableData>()
    const { created } = await dataSet.add(injector, entityToCreate)
    if (!created || !created.length) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(created[0], 201)
  }
  return endpoint
}
