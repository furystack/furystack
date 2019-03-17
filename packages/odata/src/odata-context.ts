import { Injectable } from '@furystack/inject'
import { Collection } from './models'

/**
 * Context model for OData operations
 */
@Injectable({ lifetime: 'scoped' })
export class OdataContext<T> {
  public collection!: Collection<T>
  public entityId?: number | string
  public context!: string
  public queryParams!: {
    count?: boolean
    top?: number
    skip?: number
    filter?: string
    select?: Array<keyof T>
    expand?: Array<keyof T>
    orderby?: string
  }
}
