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

export interface RequestOptions<TQuery, TBody> {
  injector: Injector
  query: TQuery
  body: TBody
}

/**
 * Interface for a HTTP Request action
 */
export type RequestAction<TResult, TReqQuery, TReqBody> = (
  options: RequestOptions<TReqQuery, TReqBody>,
) => Promise<ActionResult<TResult>>
