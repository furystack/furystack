import { RequestAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'

/**
 * OData Post action
 */
export const PostAction: RequestAction = async injector => {
  const incomingMessage = injector.getRequest()
  const context = injector.getInstance(OdataContext)
  const repo = injector.getInstance(Repository)

  const dataSet = repo.getDataSetFor<any>(context.collection.name)

  const postBody = await incomingMessage.readPostBody()

  const missingProps: string[] = []
  // ToDo: Validate required properties
  context.entity.properties
    .filter(prop => prop.nullable === false)
    .map(prop => {
      if ((postBody as any)[prop.property] === undefined) {
        missingProps.push(prop.property)
      }
    })

  if (missingProps.length) {
    return JsonResult({ error: { message: `Missing field(s): ${missingProps.join(',')}` } }, 400)
  }

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
