import { Constructable } from '@furystack/inject'
import { GetCollectionEndpoint } from '@furystack/rest'
import '@furystack/repository'
import { JsonResult, RequestAction } from '../request-action-implementation'
import { getRepository } from '@furystack/repository'

/**
 * Creates a GetCollection endpoint for the given model. The model should have a Repository DataSet
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field used as primary key on the model
 * @returns The created endpoint
 */
export const createGetCollectionEndpoint = <T, TPrimaryKey extends keyof T>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<GetCollectionEndpoint<T>> = async ({ injector, getQuery }) => {
    const { findOptions } = getQuery()
    const dataSet = getRepository(injector).getDataSetFor(options.model, options.primaryKey)
    const entriesPromise = dataSet.find<any>(injector, findOptions || {})
    const countPromise = dataSet.count(injector, findOptions?.filter)
    const [entries, count] = await Promise.all([entriesPromise, countPromise])

    return JsonResult({ entries, count })
  }
  return endpoint
}
