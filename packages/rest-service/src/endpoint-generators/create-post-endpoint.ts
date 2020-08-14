import { Constructable } from '@furystack/inject'
import { JsonResult, RequestError, PostEndpoint } from '@furystack/rest'
import '@furystack/repository'

/**
 * Creates a POST endpoint for updating entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @returns a boolean that indicates the success
 */
export const createPostEndpoint = <T extends object>(options: { model: Constructable<T> }) => {
  const endpoint: PostEndpoint<T> = async ({ injector, request }) => {
    const entityToCreate = await request.readPostBody<T>()
    const dataSet = injector.getDataSetFor(options.model)
    const { created } = await dataSet.add(injector, entityToCreate)
    if (!created || !created.length) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(created[0])
  }
  return endpoint
}
