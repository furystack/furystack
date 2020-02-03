import { RequestAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'
import { OdataContext } from '../odata-context'

/**
 * OData Patch action
 */
export const PatchAction: RequestAction = async injector => {
  const repo = injector.getInstance(Repository)
  const context = injector.getInstance(OdataContext)
  const incomingMessage = injector.getRequest()

  const dataSet = repo.getDataSetFor<any>(context.collection.name)
  const postBody = await incomingMessage.readPostBody()

  await dataSet.update(injector, context.entityId, postBody)

  return JsonResult({}, 204, {
    'content-type': 'application/json',
    'odata.metadata': 'none',
  })
}
