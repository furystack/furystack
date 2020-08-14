import { Constructable } from '@furystack/inject'
import { JsonResult, RequestError, PostEndpoint } from '@furystack/rest'
import '@furystack/repository'

export const createPostEndpoint = <T extends object>(model: Constructable<T>) => {
  const endpoint: PostEndpoint<T> = async ({ injector, request }) => {
    const entityToCreate = await request.readPostBody<T>()
    const dataSet = injector.getDataSetFor(model)
    const { created } = await dataSet.add(injector, entityToCreate)
    if (!created || !created.length) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(created[0])
  }
  return endpoint
}
