import { Entity } from '../models'
import { FilterType, SingleComparisonOperators, NumberComparisonOperators } from '@furystack/core'
import { parseFieldValue } from './field-value'

export const parseSingleOperation = <T, K extends keyof T>(
  subject: K,
  operator: typeof SingleComparisonOperators[number],
  value: T[K],
) => {
  const f: any = {}
  f[subject] = {}
  ;(f[subject] as any)[operator] = value
  return f as FilterType<T>
}

export const operatorRegex = new RegExp(
  `(?<subject>([a-zA-Z0-9_.]+)) (?<operator>(${[...SingleComparisonOperators, ...NumberComparisonOperators]
    .map(op => op.replace('$', ''))
    .join('|')})) ('(?<stringValue>.*)'|(?<numberValue>[0-9\\.]*))$`,
)

export const parseOperator = <T>(filter: string, entity: Entity<T>): FilterType<T> => {
  const { subject, operator, stringValue, numberValue } = operatorRegex.exec(filter)?.groups as {
    subject: string
    operator: any
    stringValue: string
    numberValue: string
  }
  return parseSingleOperation(
    subject as any,
    `$${operator}` as any,
    parseFieldValue(stringValue || numberValue, subject, entity) as any,
  )
}

export const parseFilter = <T>(filter: string, entity: Entity<T>): FilterType<T> => {
  if (operatorRegex.test(filter)) {
    return parseOperator(filter, entity)
  } else {
    throw new Error(`Failed to parse the following expression: '${filter}'`)
  }
}
