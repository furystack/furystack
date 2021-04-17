import { Constructable } from '@furystack/inject'
import { RequestError, GetEntityEndpoint } from '@furystack/rest'
import '@furystack/repository'
import { JsonResult, RequestAction } from '../request-action-implementation'

/**
 * Creates a simple Get Entity endpoint for a specified model.
 *
 * @param options The options for endpoint creation
 * @param options.model The entity model, should have a Repository DataSet
 * @param options.primaryKey The field name used as primary key on the model
 * @returns The generated endpoint
 */
export const createGetEntityEndpoint = <T extends object, TPrimaryKey extends keyof T>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<GetEntityEndpoint<T, TPrimaryKey>> = async ({ injector, getUrlParams, getQuery }) => {
    const { id } = getUrlParams()
    const { select } = getQuery()
    const dataSet = injector.getDataSetFor(options.model, options.primaryKey)
    const entry = await dataSet.get(injector, id, select)
    if (!entry) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(entry)
  }
  return endpoint
}
