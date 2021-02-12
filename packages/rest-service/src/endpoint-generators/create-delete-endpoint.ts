import { Constructable } from '@furystack/inject'
import { DeleteEndpoint } from '@furystack/rest'
import '@furystack/repository'
import { JsonResult, RequestActionImplementation } from '../request-action-implementation'

/**
 * Creates a DELETE endpoint for removing entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @returns a boolean that indicates the success
 */
export const createDeleteEndpoint = <T extends object>(options: { model: Constructable<T> }) => {
  const endpoint: RequestActionImplementation<DeleteEndpoint<T>> = async ({ injector, getUrlParams }) => {
    const { id } = getUrlParams()
    const dataSet = injector.getDataSetFor(options.model)
    await dataSet.remove(injector, id)
    return JsonResult({}, 204)
  }
  return endpoint
}
