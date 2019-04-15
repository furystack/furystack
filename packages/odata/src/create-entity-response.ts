import { Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { PathHelper } from '@sensenet/client-utils'
import { getOdataParams } from './getOdataParams'
import { Entity, NavigationProperty, NavigationPropertyCollection } from './models'
import { OdataContext } from './odata-context'

/**
 * Removes the most outer level from the expand expression
 * @param expand The Expand expression
 * @param entityType The type of the entity
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
      const entityType = options.entityTypes.find(t => t.model === navProperty.relatedModel) as Entity<
        typeof navProperty.relatedModel
      >
      const poppedExpandLevel = popExpandLevel(options.odataParams.expandExpression as string)

      if ((navProperty as NavigationProperty<any>).getRelatedEntity) {
        const expanded = await (navProperty as NavigationProperty<any>).getRelatedEntity(
          options.entity,
          dataSet,
          options.injector,
          options.odataParams,
        )
        expandedEntity[navProperty.propertyName] = await createEntityResponse({
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
      } else if ((navProperty as NavigationPropertyCollection<any>).getRelatedEntities) {
        const expandedEntities = await Promise.all(
          (await (navProperty as NavigationPropertyCollection<any>).getRelatedEntities(
            options.entity,
            dataSet,
            options.injector,
            options.odataParams,
          )).map(async expanded => {
            return await createEntityResponse({
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
        expandedEntity[navProperty.propertyName] = expandedEntities
      }
    }),
  )
  return expandedEntity
}
