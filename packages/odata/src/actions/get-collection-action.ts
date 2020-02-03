import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'
import { RequestAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'

/**
 * OData Get Collection action
 */
export const GetCollectionAction: RequestAction = async injector => {
  const repo = injector.getInstance(Repository)
  const context = injector.getInstance(OdataContext)
  const dataSet = repo.getDataSetFor(context.collection.name)
  const plainValue = await dataSet.filter(injector, {
    order: context.queryParams.orderBy as any,
    skip: context.queryParams.skip,
    top: context.queryParams.top,
    select: context.queryParams.select,
    filter: context.queryParams.filter,
  })
  const count = await dataSet.count(injector)
  const value = await Promise.all(
    plainValue.map(
      async entity =>
        await createEntityResponse({
          entity,
          entityTypes: context.entities,
          entityType: context.entity,
          odataParams: context.queryParams,
          injector,
          repo,
          odataContext: context,
        }),
    ),
  )

  return JsonResult(
    {
      '@odata.context': context.context,
      '@odata.count': count,
      // '@odata.nextLink': 'ToDo',
      value,
    },
    undefined,
    {
      'odata.metadata': 'minimal',
    },
  )
}
