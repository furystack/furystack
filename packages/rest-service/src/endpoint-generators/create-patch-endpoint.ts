import { Constructable } from '@furystack/inject'
import { JsonResult, PatchEndpoint } from '@furystack/rest'
import '@furystack/repository'

export const createPatchEndpoint = <T extends object>(model: Constructable<T>) => {
  const endpoint: PatchEndpoint<T> = async ({ injector, request, getUrlParams }) => {
    const { id } = getUrlParams()
    const patchData = await request.readPostBody<T>()
    const dataSet = injector.getDataSetFor(model)
    await dataSet.update(injector, id, patchData)
    return JsonResult({ success: true })
  }
  return endpoint
}
