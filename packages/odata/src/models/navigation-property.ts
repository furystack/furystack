import { DefaultFilter } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'

/**
 * Navigation property definition
 */
export interface NavigationProperty<TBaseModel, TRelatedModel> {
  /**
   * Name of the field (e.g. 'assignee')
   */
  propertyName: string

  /**
   * The Related model type class
   */
  relatedModel: Constructable<TRelatedModel>

  /**
   * Name of the DataSet (e.g. 'users')
   */
  dataSet: string

  /**
   * Async method implementation that returns an entity with the related model
   */
  getRelatedEntity: (
    /**
     * The base model
     */
    entity: TBaseModel,
    /**
     * DataSet of the related model
     */
    dataSet: DataSet<TRelatedModel, DefaultFilter<TRelatedModel>>,
    /**
     * An injector instance from the context
     */
    injector: Injector,
    /**
     * An optional filter definition
     */
    filter: DefaultFilter<TRelatedModel>,
  ) => Promise<TRelatedModel>
}

/**
 * Model that defines a navigation property that returns a collection
 */
export interface NavigationPropertyCollection<TBaseModel, TRelatedModel> {
  /**
   * Name of the property (e.g.: 'friends')
   */
  propertyName: string
  /**
   * Related model constructable class
   */
  relatedModel: Constructable<TRelatedModel>
  /**
   * DataSet name that contains dataSet with the related model
   */
  dataSet: string

  /**
   * Async method implementation that returns an array of the related models
   */
  getRelatedEntities: (
    /**
     * The base model instance
     */
    entity: TBaseModel,
    /**
     * DataSet for the related entity data
     */
    dataSet: DataSet<TRelatedModel, DefaultFilter<TRelatedModel>>,

    /**
     * An injector instance from the context
     */
    injector: Injector,

    /**
     * An optional filter definition
     */
    filter: DefaultFilter<TRelatedModel>,
  ) => Promise<TRelatedModel[]>
}
