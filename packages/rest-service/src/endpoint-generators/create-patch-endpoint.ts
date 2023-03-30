import type { Constructable } from '@furystack/inject'
import type { PatchEndpoint } from '@furystack/rest'
import '@furystack/repository'
import '../incoming-message-extensions'
import type { RequestAction } from '../request-action-implementation'
import { JsonResult } from '../request-action-implementation'
import { getRepository } from '@furystack/repository'
import type { WithOptionalId } from '@furystack/core'

/**
 * Creates a PATCH endpoint for updating entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @param options.primaryKey The field name that is used as primary key on the model
 * @returns a boolean that indicates the success
 */
export const createPatchEndpoint = <
  T extends object,
  TPrimaryKey extends keyof T,
  TWritableData = WithOptionalId<T, TPrimaryKey>,
>(options: {
  model: Constructable<T>
  primaryKey: TPrimaryKey
}) => {
  const endpoint: RequestAction<PatchEndpoint<T, TPrimaryKey, TWritableData>> = async ({
    injector,
    request,
    getUrlParams,
  }) => {
    const { id } = getUrlParams()
    const patchData = await request.readPostBody<T>()
    const dataSet = getRepository(injector).getDataSetFor(options.model, options.primaryKey)
    await dataSet.update(injector, id, patchData)
    return JsonResult({})
  }
  return endpoint
}
