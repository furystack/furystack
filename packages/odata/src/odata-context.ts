import { Injectable } from '@furystack/inject'
import { getOdataParams } from './getOdataParams'
import { Collection, Entity } from './models'

/**
 * Context model for OData operations
 */
@Injectable({ lifetime: 'scoped' })
export class OdataContext<T> {
  public server!: string
  public entities!: Array<Entity<any>>
  public collections!: Array<Collection<any>>
  public collection!: Collection<T>
  public entityId?: number | string
  public context!: string
  public entity!: Entity<T>
  public queryParams!: ReturnType<typeof getOdataParams>
}
