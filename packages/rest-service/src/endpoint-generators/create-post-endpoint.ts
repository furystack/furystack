import { Constructable } from '@furystack/inject'
import { RequestError, PostEndpoint } from '@furystack/rest'
import '@furystack/repository'
import '../incoming-message-extensions'
import { JsonResult, RequestAction } from '../request-action-implementation'
import { WithOptionalId } from '@furystack/core'
/**
 * Creates a POST endpoint for updating entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field name used as primary key
 * @returns a boolean that indicates the success
 */
export const createPostEndpoint = <T extends object, TPrimaryKey extends keyof T>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<PostEndpoint<T, TPrimaryKey>> = async ({ injector, request }) => {
    const dataSet = injector.getDataSetFor(options.model, options.primaryKey)

    const entityToCreate = await request.readPostBody<WithOptionalId<T, typeof dataSet['primaryKey']>>()
    const { created } = await dataSet.add(injector, entityToCreate)
    if (!created || !created.length) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(created[0], 201)
  }
  return endpoint
}
