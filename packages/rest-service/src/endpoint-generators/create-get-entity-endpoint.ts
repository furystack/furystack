import { Constructable } from '@furystack/inject'
import { RequestError, GetEntityEndpoint } from '@furystack/rest'
import '@furystack/repository'
import { JsonResult, RequestActionImplementation } from '../request-action-implementation'

/**
 * Creates a simple Get Entity endpoint for a specified model.
 *
 * @param options The options for endpoint creation
 * @param options.model The entity model, should have a Repository DataSet
 * @returns The generated endpoint
 */
export const createGetEntityEndpoint = <T>(options: { model: Constructable<T> }) => {
  const endpoint: RequestActionImplementation<GetEntityEndpoint<T>> = async ({ injector, getUrlParams, getQuery }) => {
    const { id } = getUrlParams()
    const { select } = getQuery()
    const dataSet = injector.getDataSetFor(options.model)
    const entry = await dataSet.get(injector, id, select)
    if (!entry) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(entry)
  }
  return endpoint
}
