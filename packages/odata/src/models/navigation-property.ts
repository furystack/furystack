import { DefaultFilter } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'

/**
 * Model that defines a navigation property
 */
export interface NavigationProperty<T> {
  propertyName: string
  relatedModel: Constructable<T>
  getRelatedEntity: (dataSet: DataSet<T, DefaultFilter<T>>, injector: Injector) => Promise<T>
}

/**
 * Model that defines a navigation property that returns a collection
 */
export interface NavigationPropertyCollection<T> {
  propertyName: string
  relatedModel: Constructable<T>
  getRelatedEntities: (dataSet: DataSet<T, DefaultFilter<T>>, injector: Injector) => Promise<T[]>
}
