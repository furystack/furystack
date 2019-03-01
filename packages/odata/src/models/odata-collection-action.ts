import { DefaultFilter } from '@furystack/core'
import { DataSet } from '@furystack/repository'

/**
 * Model that defines a custom OData action that can be called on an entity
 */
export interface ODataCollectionAction<TEntity, TParams, TReturns> {
  exec: (collection: DataSet<TEntity, DefaultFilter<TEntity>>, params: TParams) => Promise<TReturns>
}
