import { Entity } from '../models'
import { FilterType } from '../../../core/src'
import { parseFieldValue } from './field-value'

export const parseSingleOperation = <T>(options: {
  filter: string
  entity: Entity<T>
  operator: string
  operatorKey: string
}): FilterType<T> => {
  const filterObj: FilterType<T> = {}
  const [fieldName, value] = options.filter.split(` ${options.operator} `)
  const parsedValue = parseFieldValue(value.replace(/'/g, ''), fieldName, options.entity)
  filterObj[fieldName as keyof T] = {}
  ;(filterObj as any)[fieldName as keyof T][options.operatorKey] = parsedValue as any
  return filterObj
}

export const parseFilter = <T>(filter: string, entity: Entity<T>): FilterType<T> => {
  // eq -> $eq
  if (filter.match(/([A-Za-z0-9]+)\s+([eq]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'eq', operatorKey: '$eq' })
  }

  // ne -> $ne
  if (filter.match(/([A-Za-z0-9]+)\s+([ne]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'ne', operatorKey: '$ne' })
  }

  // gt -> $gt
  if (filter.match(/([A-Za-z0-9]+)\s+([gt]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'gt', operatorKey: '$gt' })
  }

  // gte -> $gte
  if (filter.match(/([A-Za-z0-9]+)\s+([gte]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'gte', operatorKey: '$gte' })
  }

  // lt -> $lt
  if (filter.match(/([A-Za-z0-9]+)\s+([lt]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'lt', operatorKey: '$lt' })
  }

  // lte -> $lte
  if (filter.match(/([A-Za-z0-9]+)\s+([lte]+)\s('?)[A-Za-z0-9.]+('?)/)) {
    return parseSingleOperation({ filter, entity, operator: 'lte', operatorKey: '$lte' })
  }

  throw new Error(`Failed to parse the following expression: '${filter}'`)
}
