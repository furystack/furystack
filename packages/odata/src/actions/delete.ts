import { RequestAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'
import { OdataContext } from '../odata-context'

/**
 * OData Delete action
 *
 * @param injector The Injector from the Stack
 */
export const DeleteAction: RequestAction = async injector => {
  const repo = injector.getInstance(Repository)
  const context = injector.getInstance(OdataContext)
  const dataSet = repo.getDataSetFor<any>(context.collection.name)
  await dataSet.remove(injector, context.entityId)
  return JsonResult({}, 204, { 'odata.metadata': 'none' })
}
