import { Constructable } from '@furystack/inject'
import { IncomingMessage } from 'http'
import { parse } from 'url'

/**
 * Returns the possible OData params from a request
 * @param request The incoming request message
 */
export const getOdataParams = <T>(request: IncomingMessage, model: Constructable<T>) => {
  const getOrderByValue = (value: string): Array<[keyof T, string]> => {
    value = value.trim()
    if (value.indexOf(',') !== -1) {
      return value
        .split(',')
        .map(v => getOrderByValue(v))
        .flat(1)
    }
    if (value.indexOf(' ') !== -1) {
      return [value.split(' ') as [keyof T, string]]
    }
    return [[value as keyof T, 'asc']]
  }

  const params = (request.url && parse(request.url, true).query) || {}
  const orderBy = (params.$orderby && getOrderByValue(params.$orderby.toString())) || undefined

  return {
    skip: parseInt(params.$skip as string, 10) || undefined,
    top: parseInt(params.$top as string, 10) || undefined,
    select: (params.$select && ((params.$select as string).split(',') as Array<keyof T>)) || undefined,
    expand: (params.$expand && ((params.$expand as string).split(',') as Array<keyof T>)) || undefined,
    orderBy,
  }
}
