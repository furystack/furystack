import { parse } from 'url'
import { Entity } from './models'
import { parseFilter } from './parsers/filter'
import { parseOrderBy } from './parsers/order-by'
import { FilterType } from '@furystack/core'

export type OrderType<T> = { [key in keyof T]?: 'ASC' | 'DESC' }
export interface OdataParams<T> {
  select: Array<keyof T>
  expand: Array<keyof T>
  orderBy: OrderType<T> | undefined
  expandExpression: string
  filter: FilterType<T>
  top: number
  skip: number
}

/**
 * Returns the possible OData params from a request
 *
 * @param url The full URL
 * @param entity The generic Entity instance
 * @returns the created OData params
 */
export const getOdataParams = <T>(url: string | undefined, entity: Entity<T>) => {
  const params = (url && parse(url, true).query) || {}
  const orderBy = (params.$orderby && parseOrderBy(params.$orderby.toString())) || undefined

  const value: OdataParams<T> = {
    ...(params.$skip ? { skip: parseInt(params.$skip as string, 10) } : { skip: 0 }),
    ...(params.$top ? { top: parseInt(params.$top as string, 10) } : { top: 0 }),
    ...(params.$filter ? { filter: parseFilter(params.$filter as string, entity) } : { filter: {} }),
    select:
      (params.$select && ((params.$select as string).split(',') as Array<keyof T>)) ||
      entity.properties.map(p => p.property) ||
      [],
    expand: (params.$expand && ((params.$expand as string).split('(')[0].split(',') as Array<keyof T>)) || [],
    orderBy,
    expandExpression: params.$expand as string,
  }

  return value
}
