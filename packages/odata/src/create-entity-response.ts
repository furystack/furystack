import { Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { PathHelper } from '@sensenet/client-utils'
import { getOdataParams } from './getOdataParams'
import { Entity, NavigationProperty, NavigationPropertyCollection } from './models'
import { OdataContext } from './odata-context'

/**
 * Method that adds expanded fields to an entity model
 * @param options The options to be provided
 */
export const createEntityResponse = async <T>(options: {
  injector: Injector
  entity: T
  entityType: Entity<T>
  entityTypes: Array<Entity<any>>
  odataParams: ReturnType<typeof getOdataParams>
  repo: Repository
  odataContext: OdataContext<T>
}) => {
  const returnEntity: any = {}

  for (const selectField of options.odataParams.select) {
    returnEntity[selectField] = options.entity[selectField]
  }

  const entityId = options.entity[options.entityType.primaryKey]

  returnEntity['@odata.id'] = PathHelper.joinPaths(
    options.odataContext.server,
    options.odataContext.odataRoute,
    (options.odataContext.navigationProperty && options.odataContext.navigationProperty.dataSet) ||
      options.odataContext.collection.name,
    typeof entityId === 'number' ? `(${entityId.toString()})` : `('${entityId}')`,
  )

  if (options.odataParams.expand.length === 0) {
    return returnEntity
  }

  const navExpressions: Array<{
    expandExpression: string
    navProperty: NavigationProperty<any> | NavigationPropertyCollection<any>
  }> = options.odataParams.expand
    .map(
      fieldName =>
        ({
          expandExpression: fieldName,
          navProperty:
            options.entityType.navigationProperties &&
            options.entityType.navigationProperties.find(np => np.propertyName === (fieldName as string).split('(')[0]),
        } as any),
    )
    .filter(np => np.navProperty !== undefined)

  if (!navExpressions.length) {
    return returnEntity
  }

  const expandedEntity = { ...returnEntity } as T & { [key: string]: any }
  await Promise.all(
    navExpressions.map(async navExpression => {
      const navProperty = navExpression.navProperty
      const dataSet = options.repo.getDataSetFor(navProperty.dataSet || navProperty.relatedModel)
      if ((navProperty as NavigationProperty<any>).getRelatedEntity) {
        const expanded = await (navProperty as NavigationProperty<any>).getRelatedEntity(
          options.entity,
          dataSet,
          options.injector,
          {},
        )
        expandedEntity[navProperty.propertyName] = expanded
      } else if ((navProperty as NavigationPropertyCollection<any>).getRelatedEntities) {
        const expandedEntities = await Promise.all(
          (await (navProperty as NavigationPropertyCollection<any>).getRelatedEntities(
            options.entity,
            dataSet,
            options.injector,
            {},
          )).map(async expanded => {
            const initial = navExpression.expandExpression.split('(')
            initial.shift()
            const withoutPrefix = initial.join('(').split(')')
            withoutPrefix.pop()
            const withoutPostfix = withoutPrefix.join(')')

            const withFirstSegment = withoutPostfix.split('(')
            withFirstSegment[0] = withFirstSegment[0].replace(/;/g, '&')
            const final = withFirstSegment.join('(')

            const entityType = options.entityTypes.find(t => t.model === navProperty.relatedModel) as Entity<
              typeof navProperty.relatedModel
            >
            return await createEntityResponse({
              entity: expanded,
              injector: options.injector,
              entityType,
              entityTypes: options.entityTypes,
              odataParams: getOdataParams(`?${final}`, entityType),
              repo: options.repo,
              odataContext: options.odataContext,
            })
          }),
        )
        expandedEntity[navProperty.propertyName] = expandedEntities
      }
    }),
  )
  return expandedEntity
}
