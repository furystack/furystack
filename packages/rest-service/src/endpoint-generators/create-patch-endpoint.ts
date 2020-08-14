import { Constructable } from '@furystack/inject'
import { PatchEndpoint, PlainTextResult } from '@furystack/rest'
import '@furystack/repository'
import '../incoming-message-extensions'

/**
 * Creates a PATCH endpoint for updating entities
 *
 * @param options The options for endpoint creation
 * @param options.model The Model class
 * @returns a boolean that indicates the success
 */
export const createPatchEndpoint = <T extends object>(options: { model: Constructable<T> }) => {
  const endpoint: PatchEndpoint<T> = async ({ injector, request, getUrlParams }) => {
    const { id } = getUrlParams()
    const patchData = await request.readPostBody<T>()
    const dataSet = injector.getDataSetFor(options.model)
    await dataSet.update(injector, id, patchData)
    return PlainTextResult('')
  }
  return endpoint
}
