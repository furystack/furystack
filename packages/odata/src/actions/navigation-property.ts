import { RequestAction, NotFoundAction, JsonResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { getOdataParams } from '../getOdataParams'
import { OdataContext } from '../odata-context'

/**
 * OData Navigation Property action
 */
export const NavigationPropertyAction: RequestAction = async injector => {
  const repo = injector.getInstance(Repository)
  const context = injector.getInstance(OdataContext)
  const request = injector.getRequest()

  if (!context.navigationProperty) {
    throw Error(`No navigation property`)
  }
  const navProp = context.navigationProperty
  const dataSet = repo.getDataSetFor(navProp.dataSet)
  const relatedEntityType = context.entities.find(e => e.model === navProp.relatedModel)

  const baseDataSet = repo.getDataSetFor(context.collection.name)
  const baseEntity = await baseDataSet.get(injector, context.entityId as never)

  if (!baseEntity) {
    return await NotFoundAction(injector)
  }

  if (!relatedEntityType) {
    throw Error('No related entity found for navigation property')
  }

  const filter = request.url && relatedEntityType ? getOdataParams(request.url, relatedEntityType) : {}

  const plainValue = await navProp.getRelatedEntity(baseEntity, dataSet, injector, filter)
  const value = await createEntityResponse({
    entity: plainValue,
    entityTypes: context.entities,
    entityType: relatedEntityType || context.entity,
    odataParams: filter as any,
    injector,
    repo,
    odataContext: context,
  })

  return JsonResult(
    {
      '@odata.context': context.context,
      ...(value instanceof Array ? { '@odata.count': value.length, value } : value),
    },
    undefined,
    {
      'odata.metadata': 'minimal',
    },
  )
}
