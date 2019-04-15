import { parse } from 'url'
import { Entity } from './models'

/**
 * Returns the possible OData params from a request
 * @param request The incoming request message
 */
export const getOdataParams = <T>(url: string | undefined, entity: Entity<T>) => {
  type OrderType = { [key in keyof T]?: 'ASC' | 'DESC' }

  const order = {} as OrderType

  const parseFilter = (filter: string) => {
    const filterObj = {} as { [key in keyof T]?: T[key] }
    const [fieldName, value] = filter.split(' eq ')
    const parsedValue = value.replace(/'/g, '')
    filterObj[fieldName as keyof T] = parsedValue as any
    return filterObj
  }

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

  const params = (url && parse(url, true).query) || {}
  const orderBy = (params.$orderby && getOrderByValue(params.$orderby.toString())) || undefined

  return {
    ...(params.$skip ? { skip: parseInt(params.$skip as string, 10) } : {}),
    ...(params.$top ? { top: parseInt(params.$top as string, 10) } : {}),
    ...(params.$filter ? { filter: parseFilter(params.$filter as string) } : {}),
    select:
      (params.$select && ((params.$select as string).split(',') as Array<keyof T>)) ||
      entity.properties.map(p => p.property),
    expand: (params.$expand && ((params.$expand as string).split('(')[0].split(',') as Array<keyof T>)) || [],
    orderBy,
    expandExpression: params.$expand as string,
  }
}
