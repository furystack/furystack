import { Constructable } from '@furystack/inject'
import { JsonResult, DeleteEndpoint } from '@furystack/rest'
import '@furystack/repository'

export const createDeleteEndpoint = <T extends object>(model: Constructable<T>) => {
  const endpoint: DeleteEndpoint<T> = async ({ injector, getUrlParams }) => {
    const { id } = getUrlParams()
    const dataSet = injector.getDataSetFor(model)
    await dataSet.remove(injector, id)
    return JsonResult({ success: true })
  }
  return endpoint
}
