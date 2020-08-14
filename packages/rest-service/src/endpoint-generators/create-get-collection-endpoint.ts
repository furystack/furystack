import { Constructable } from '@furystack/inject'
import { JsonResult, GetCollectionEndpoint } from '@furystack/rest'
import '@furystack/repository'

/**
 * Creates a GetCollection endpoint for the given model. The model should have a Repository DataSet
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @returns The created endpoint
 */
export const createGetCollectionEndpoint = <T>(options: { model: Constructable<T> }) => {
  const endpoint: GetCollectionEndpoint<T> = async ({ injector, getQuery }) => {
    const { findOptions } = getQuery()
    const dataSet = injector.getDataSetFor(options.model)
    const entriesPromise = dataSet.find<any>(injector, findOptions)
    const countPromise = dataSet.count(injector, findOptions.filter)
    const [entries, count] = await Promise.all([entriesPromise, countPromise])

    return JsonResult({ entries, count })
  }
  return endpoint
}
