/**
 * Model that defines a custom OData action that can be called on an entity
 */
export interface ODataEntityAction<TEntity, TParams, TReturns> {
  exec: (entity: TEntity, params: TParams) => Promise<TReturns>
}
