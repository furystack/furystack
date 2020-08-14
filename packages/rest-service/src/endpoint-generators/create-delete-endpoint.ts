import { Constructable } from '@furystack/inject'
import { JsonResult, DeleteEndpoint } from '@furystack/rest'
import '@furystack/repository'

/**
 * Creates a DELETE endpoint for removing entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @returns a boolean that indicates the success
 */
export const createDeleteEndpoint = <T extends object>(options: { model: Constructable<T> }) => {
  const endpoint: DeleteEndpoint<T> = async ({ injector, getUrlParams }) => {
    const { id } = getUrlParams()
    const dataSet = injector.getDataSetFor(options.model)
    await dataSet.remove(injector, id)
    return JsonResult({ success: true })
  }
  return endpoint
}
