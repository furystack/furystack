import { IncomingMessage } from 'http'
import { parse } from 'url'
import { Entity } from './models'

/**
 * Returns the possible OData params from a request
 * @param request The incoming request message
 */
export const getOdataParams = <T>(request: IncomingMessage, entity: Entity<T>) => {
  type OrderType = { [key in keyof T]?: 'ASC' | 'DESC' }

  const order = {} as OrderType

  const getOrderByValue = (value: string): OrderType => {
    value = value.trim()
    if (value.indexOf(',') !== -1) {
      const other = Object.assign({}, ...value.split(',').map(v => getOrderByValue(v)))
      return other
    }
    if (value.indexOf(' ') !== -1) {
      const [field, direction] = value.split(' ')
      order[field as keyof T] = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      return order
    }
    order[value as keyof T] = 'ASC'
    return order
  }

  const params = (request.url && parse(request.url, true).query) || {}
  const orderBy = (params.$orderby && getOrderByValue(params.$orderby.toString())) || undefined

  return {
    skip: parseInt(params.$skip as string, 10) || undefined,
    top: parseInt(params.$top as string, 10) || undefined,
    select:
      (params.$select && ((params.$select as string).split(',') as Array<keyof T>)) ||
      entity.properties.map(p => p.property),
    expand: (params.$expand && ((params.$expand as string).split(',') as Array<keyof T>)) || [],
    orderBy,
  }
}
