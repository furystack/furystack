import { Constructable } from '@furystack/inject'
import { PatchEndpoint } from '@furystack/rest'
import '@furystack/repository'
import '../incoming-message-extensions'
import { JsonResult, RequestAction } from '../request-action-implementation'
import { getRepository } from '@furystack/repository'

/**
 * Creates a PATCH endpoint for updating entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field name that is used as primary key on the model
 * @returns a boolean that indicates the success
 */
export const createPatchEndpoint = <T extends object, TPrimaryKey extends keyof T>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<PatchEndpoint<T, TPrimaryKey>> = async ({ injector, request, getUrlParams }) => {
    const { id } = getUrlParams()
    const patchData = await request.readPostBody<T>()
    const dataSet = getRepository(injector).getDataSetFor(options.model, options.primaryKey)
    await dataSet.update(injector, id, patchData)
    return JsonResult({})
  }
  return endpoint
}
