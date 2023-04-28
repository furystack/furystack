import type { Constructable } from '@furystack/inject'
import type { GetEntityEndpoint } from '@furystack/rest'
import { RequestError } from '@furystack/rest'
import '@furystack/repository'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'
import { getRepository } from '@furystack/repository'

/**
 * Creates a simple Get Entity endpoint for a specified model.
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
    const dataSet = getRepository(injector).getDataSetFor(options.model, options.primaryKey)
    const entry = await dataSet.get(injector, id, select)
    if (!entry) {
      throw new RequestError('Entity not found', 404)
    }
    return JsonResult(entry)
  }
  return endpoint
}
