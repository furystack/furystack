import { parse } from 'url'
import { Entity, EdmType } from './models'

export type OrderType<T> = { [key in keyof T]?: 'ASC' | 'DESC' }
export interface OdataParams<T> {
  select: Array<keyof T>
  expand: Array<keyof T>
  orderBy: OrderType<T> | undefined
  expandExpression: string
  filter: { [key in keyof T]?: T[key] | undefined }
  top: number
  skip: number
}

/**
 * Returns the possible OData params from a request
 * @param request The incoming request message
 */
export const getOdataParams = <T>(url: string | undefined, entity: Entity<T>) => {
  const order: OrderType<T> = {}

  const parseFilter = (filter: string) => {
    const filterObj: { [key in keyof T]?: T[key] } = {}
    const [fieldName, value] = filter.split(' eq ')
    let parsedValue: any = value.replace(/'/g, '')

    switch (entity.properties.find(f => f.property === fieldName)?.type) {
      case EdmType.Int16:
      case EdmType.Int32:
        parsedValue = parseInt(parsedValue, 10)
        break
      case EdmType.Double:
        parsedValue = parseFloat(parsedValue)
        break
      default:
        break
    }

    filterObj[fieldName as keyof T] = parsedValue as any
    return filterObj
  }

  const getOrderByValue = (value: string): OrderType<T> => {
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

  const value: OdataParams<T> = {
    ...(params.$skip ? { skip: parseInt(params.$skip as string, 10) } : { skip: 0 }),
    ...(params.$top ? { top: parseInt(params.$top as string, 10) } : { top: 0 }),
    ...(params.$filter ? { filter: parseFilter(params.$filter as string) } : { filter: {} }),
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
