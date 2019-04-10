import { Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { Entity, NavigationProperty, NavigationPropertyCollection } from './models'

/**
 * Method that adds expanded fields to an entity model
 * @param options The options to be provided
 */
export const expand = async <T>(options: {
  injector: Injector
  entity: T
  entityType: Entity<T>
  fieldNames?: Array<keyof T>
  repo: Repository
}) => {
  if (!options.fieldNames || options.fieldNames.length === 0) {
    return options.entity
  }

  const navProperties: Array<NavigationProperty<any> | NavigationPropertyCollection<any>> = options.fieldNames
    .map(
      fieldName =>
        (options.entityType.navigationProperties &&
          options.entityType.navigationProperties.find(np => np.propertyName === fieldName)) ||
        (undefined as any),
    )
    .filter(np => np !== undefined)

  if (!navProperties.length) {
    return options.entity
  }

  const expandedEntity = { ...options.entity } as T & { [key: string]: any }
  await Promise.all(
    navProperties.map(async navProperty => {
      const dataSet = options.repo.getDataSetFor(navProperty.dataSet || navProperty.relatedModel)
      if ((navProperty as NavigationProperty<any>).getRelatedEntity) {
        const expanded = await (navProperty as NavigationProperty<any>).getRelatedEntity(
          options.entity,
          dataSet,
          options.injector,
        )
        expandedEntity[navProperty.propertyName] = expanded
      } else if ((navProperty as NavigationPropertyCollection<any>).getRelatedEntities) {
        const expanded = await (navProperty as NavigationPropertyCollection<any>).getRelatedEntities(
          options.entity,
          dataSet,
          options.injector,
        )
        expandedEntity[navProperty.propertyName] = expanded
      }
    }),
  )
  return expandedEntity
}
