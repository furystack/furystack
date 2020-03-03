import { Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { PathHelper } from '@furystack/utils'
import { getOdataParams, OdataParams } from './get-odata-params'
import { Entity } from './models'
import { OdataContext } from './odata-context'

/**
 * Removes the most outer level from the expand expression
 *
 * @param expand The Expand expression
 * @returns the popped expression
 */
export const popExpandLevel = (expand: string) => {
  const initial = expand.split('(')
  initial.shift()
  const withoutPrefix = initial.join('(').split(')')
  withoutPrefix.pop()
  const withoutPostfix = withoutPrefix.join(')')

  const withFirstSegment = withoutPostfix.split('(')
  withFirstSegment[0] = withFirstSegment[0].replace(/;/g, '&')
  const final = withFirstSegment.join('(')
  return final
}

/**
 * Method that adds expanded fields to an entity model
 *
 * @param options The options to be provided
 */
export const createEntityResponse = async <T>(options: {
  injector: Injector
  entity: T
  entityType: Entity<T>
  entityTypes: Array<Entity<any>>
  odataParams: OdataParams<T>
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

  const navExpressions = options.odataParams.expand.map(fieldName => ({
    expandExpression: fieldName,
    navProperty:
      options.entityType.navigationProperties &&
      options.entityType.navigationProperties.find(np => np.propertyName === (fieldName as string).split('(')[0]),
    navPropertyCollection:
      options.entityType.navigationPropertyCollections &&
      options.entityType.navigationPropertyCollections.find(
        np => np.propertyName === (fieldName as string).split('(')[0],
      ),
  }))

  if (!navExpressions.length) {
    return returnEntity
  }

  const expandedEntity = { ...returnEntity }
  await Promise.all(
    navExpressions.map(async navExpression => {
      const { navProperty } = navExpression
      const { navPropertyCollection } = navExpression

      if (navProperty) {
        const dataSet = options.repo.getDataSetFor(navProperty.dataSet || navProperty.relatedModel)
        const entityType = options.entityTypes.find(t => t.model === navProperty.relatedModel) as Entity<
          typeof navProperty.relatedModel
        >

        const poppedExpandLevel = popExpandLevel(options.odataParams.expandExpression)
        const expandOdataParams = options.odataParams.expandExpression
          ? {
              expandExpression: poppedExpandLevel,
              ...getOdataParams(`?${poppedExpandLevel}`, entityType),
            }
          : {}
        const expanded = await navProperty.getRelatedEntity(options.entity, dataSet, options.injector, {
          ...expandOdataParams,
        })
        expandedEntity[navProperty.propertyName] = await createEntityResponse<any>({
          entity: expanded,
          injector: options.injector,
          entityType,
          entityTypes: options.entityTypes,
          odataParams: {
            ...expandOdataParams,
          } as any,
          repo: options.repo,
          odataContext: {
            ...options.odataContext,
            navigationProperty: navProperty,
          },
        })
      } else if (navPropertyCollection) {
        const dataSet = options.repo.getDataSetFor(navPropertyCollection.dataSet || navPropertyCollection.relatedModel)
        const entityType = options.entityTypes.find(t => t.model === navPropertyCollection.relatedModel) as Entity<
          typeof navPropertyCollection.relatedModel
        >
        const poppedExpandLevel = popExpandLevel(options.odataParams.expandExpression)

        const expandedEntities = await Promise.all(
          (
            await navPropertyCollection.getRelatedEntities<any>(
              options.entity,
              dataSet,
              options.injector,
              options.odataParams,
            )
          ).map(async expanded => {
            return await createEntityResponse<any>({
              entity: expanded,
              injector: options.injector,
              entityType,
              entityTypes: options.entityTypes,
              odataParams: {
                ...options.odataParams,
                ...(options.odataParams.expandExpression
                  ? {
                      expandExpression: poppedExpandLevel,
                      expand: getOdataParams(`?${poppedExpandLevel}`, entityType).expand,
                    }
                  : {}),
              },
              repo: options.repo,
              odataContext: options.odataContext,
            })
          }),
        )
        expandedEntity[navPropertyCollection.propertyName] = expandedEntities
      }
    }),
  )
  return expandedEntity
}
