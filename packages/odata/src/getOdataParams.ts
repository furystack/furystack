import { IncomingMessage } from 'http'
import { parse } from 'url'

/**
 * Returns the possible OData params from a request
 * @param request The incoming request message
 */
export const getOdataParams = (request: IncomingMessage) => {
  const params = (request.url && parse(request.url, true).query) || {}

  return {
    skip: parseInt(params.$skip as string, 10) || undefined,
    top: parseInt(params.$top as string, 10) || undefined,
    select: ((params.$select && (params.$select as string).split(',')) as any) || undefined,
    expand: (params.$expand && (params.$expand as string).split(',')) || undefined,
  }
}
