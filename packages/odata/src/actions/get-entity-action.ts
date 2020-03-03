import { RequestAction, NotFoundAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'

/**
 * Odata Get Entity action
 *
 * @param injector The Injector from the Stack
 */
export const GetEntityAction: RequestAction = async injector => {
  const context = injector.getInstance(OdataContext)
  const repo = injector.getInstance(Repository)

  const dataSet = repo.getDataSetFor<any>(context.collection.name)
  const entity = await dataSet.get(injector, context.entityId)

  if (!entity) {
    return await NotFoundAction(injector)
  }

  const expandedEntity = await createEntityResponse({
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
      '@odata.context': context.context,
      ...expandedEntity,
    },
    undefined,
    { 'content-type': 'application/json', 'odata.metadata': 'minimal' },
  )
}
