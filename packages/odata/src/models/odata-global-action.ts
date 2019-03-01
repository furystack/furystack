/**
 * Model for OData Actions
 */
export interface OdataGlobalAction<TParams, TReturns> {
  exec: (params: TParams) => Promise<TReturns>
}
