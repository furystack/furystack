import { Constructable } from '@furystack/inject'
import { DeleteEndpoint } from '@furystack/rest'
import '@furystack/repository'
import { JsonResult, RequestAction } from '../request-action-implementation'
import { getRepository } from '@furystack/repository'

/**
 * Creates a DELETE endpoint for removing entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field used as primary key on the model
 * @returns a boolean that indicates the success
 */
export const createDeleteEndpoint = <T extends object, TPrimaryKey extends keyof T>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<DeleteEndpoint<T, TPrimaryKey>> = async ({ injector, getUrlParams }) => {
    const { id } = getUrlParams()
    const dataSet = getRepository(injector).getDataSetFor(options.model, options.primaryKey)
    await dataSet.remove(injector, id)
    return JsonResult({}, 204)
  }
  return endpoint
}
