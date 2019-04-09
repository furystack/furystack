import { EntitySet } from './entity-set'
import { EntityType } from './entity-type'
import { OdataAction } from './odata-action'
import { OdataFunction } from './odata-function'

/**
 * OData endpoint model definition
 */
export interface OdataEndpoint {
  entityTypes: EntityType[]
  entitySets: EntitySet[]
  actions: OdataAction[]
  functions: OdataFunction[]
}
