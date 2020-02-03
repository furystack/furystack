import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'
import { RequestAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'

/**
 * OData Post action
 */
export const PostAction: RequestAction = async injector => {
  const incomingMessage = injector.getRequest()
  const context = injector.getInstance(OdataContext)
  const repo = injector.getInstance(Repository)

  const dataSet = repo.getDataSetFor<any>(context.collection.name)

  const postBody = await incomingMessage.readPostBody()

  const entity = await dataSet.add(injector, postBody)

  const expanded = await createEntityResponse({
    entity,
    entityTypes: context.entities,
    entityType: context.entity,
    odataParams: context.queryParams,
    injector,
    repo,
    odataContext: context,
  })

  return JsonResult(
    {
      ...expanded,
    },
    201,
    { 'odata.metadata': 'minimal' },
  )
}
