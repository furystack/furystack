import { DefaultFilter } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'

/**
 * Model that defines a navigation property that returns a
 */
export interface NavigationProperty<T> {
  propertyName: string
  relatedModel: Constructable<T>
  dataSet: string
  getRelatedEntity: (
    entity: T,
    dataSet: DataSet<T, DefaultFilter<T>>,
    injector: Injector,
    filter: DefaultFilter<T>,
  ) => Promise<T>
}

/**
 * Model that defines a navigation property that returns a collection
 */
export interface NavigationPropertyCollection<T> {
  propertyName: string
  relatedModel: Constructable<T>
  dataSet: string
  getRelatedEntities: (
    entity: T,
    dataSet: DataSet<T, DefaultFilter<T>>,
    injector: Injector,
    filter: DefaultFilter<T>,
  ) => Promise<T[]>
}
