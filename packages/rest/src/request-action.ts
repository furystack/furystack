import { Injector } from '@furystack/inject'

export interface ActionResult<T> {
  statusCode: number
  headers: { [K: string]: string }
  chunk: T
}

export const JsonResult = <T extends object>(chunk: T, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  } as ActionResult<T>)

export const PlainTextResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'plain/text',
    },
  } as ActionResult<string>)

export const XmlResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'application/xml;charset=utf-8',
    },
  } as ActionResult<string>)

export const EmptyResult = (statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    headers: {
      ...headers,
    },
  } as ActionResult<undefined>)

export const BypassResult = () =>
  ({
    chunk: 'BypassResult',
  } as ActionResult<'BypassResult'>)

export type RequestOptions<TQuery, TBody, TUrlParams, THeaders> = {
  // The injector in the scope of the current request
  injector: Injector
  request: import('http').IncomingMessage
  response: import('http').ServerResponse
} & (unknown extends TQuery
  ? {}
  : {
      // Parameters from the Query object (e.g.: ?search=foo => {search: "foo"})
      getQuery: () => TQuery
    }) &
  (unknown extends TBody
    ? {}
    : {
        // The post body type
        getBody: () => Promise<TBody>
      }) &
  (unknown extends TUrlParams
    ? {}
    : {
        // Params from the URL (e.g. /api/collection/:entityId => {entityId: 'someEntityId'})
        getUrlParams: () => TUrlParams
      }) &
  (unknown extends THeaders ? {} : { headers: THeaders })

export type RequestActionOptions = { result?: any; query?: any; body?: any; urlParams?: any; headers?: any }

/**
 * Interface for a HTTP Request action
 */
export type RequestAction<TOptions extends RequestActionOptions> = (
  options: RequestOptions<TOptions['query'], TOptions['body'], TOptions['urlParams'], TOptions['headers']>,
) => Promise<ActionResult<TOptions['result']>>
