import { getOdataParams } from './get-odata-params'
import { Collection, Entity, NavigationProperty, NavigationPropertyCollection } from './models'
import { Injectable } from '@furystack/inject'

/**
 * Context model for OData operations
 */
@Injectable({ lifetime: 'scoped' })
export class OdataContext<T> {
  /**
   * The Server URL (e.g.:'https://localhost:8443/')
   */
  public server!: string
  /**
   * The OData Route name (e.g.: 'odata')
   */
  public odataRoute!: string
  /**
   * List of entity definitions
   */
  public entities!: Array<Entity<any>>
  /**
   * List of collection definitions
   */
  public collections!: Array<Collection<any>>
  /**
   * The current collection definition
   */
  public collection!: Collection<T>
  /**
   * The current entity's identifier
   */
  public entityId?: number | string
  /**
   * The current OData Context URL (e.g.: 'https://localhost:8443/odata/$metadata#users')
   */
  public context!: string
  /**
   * The current entity instance
   */
  public entity!: Entity<T>
  /**
   * The current query parameters (select, expand, etc...)
   */
  public queryParams!: ReturnType<typeof getOdataParams>
  /**
   * The current Navigation Property definition
   */
  public navigationProperty?: NavigationProperty<T, any>
  /**
   * The current Navigation Property for collections definition
   */
  public navigationPropertyCollection?: NavigationPropertyCollection<T, any>
}
