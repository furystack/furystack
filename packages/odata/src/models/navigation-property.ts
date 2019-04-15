import { DefaultFilter } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'

/**
 * Model that defines a navigation property that returns a
 */
export interface NavigationProperty<TBaseModel, TRelatedModel> {
  propertyName: string
  relatedModel: Constructable<TRelatedModel>
  dataSet: string
  getRelatedEntity: (
    entity: TBaseModel,
    dataSet: DataSet<TRelatedModel, DefaultFilter<TRelatedModel>>,
    injector: Injector,
    filter: DefaultFilter<TRelatedModel>,
  ) => Promise<TRelatedModel>
}

/**
 * Model that defines a navigation property that returns a collection
 */
export interface NavigationPropertyCollection<TBaseModel, TRelatedModel> {
  propertyName: string
  relatedModel: Constructable<TRelatedModel>
  dataSet: string
  getRelatedEntities: (
    entity: TBaseModel,
    dataSet: DataSet<TRelatedModel, DefaultFilter<TRelatedModel>>,
    injector: Injector,
    filter: DefaultFilter<TRelatedModel>,
  ) => Promise<TRelatedModel[]>
}
