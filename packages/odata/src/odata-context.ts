import { Injectable } from '@furystack/inject'
import { Collection } from './models'

/**
 * Context model for OData operations
 */
@Injectable({ lifetime: 'scoped' })
export class OdataContext<T> {
  public collection!: Collection<T>
  public entity?: T
}
