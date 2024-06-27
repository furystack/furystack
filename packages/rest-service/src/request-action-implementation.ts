import type { Injector } from '@furystack/inject'
import type { IncomingMessage, ServerResponse } from 'http'

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
  }) as ActionResult<T>

export const PlainTextResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'plain/text',
    },
  }) as ActionResult<string>

export const XmlResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'application/xml;charset=utf-8',
    },
  }) as ActionResult<string>

export const EmptyResult = (statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    headers: {
      ...headers,
    },
  }) as ActionResult<undefined>

export const BypassResult = () =>
  ({
    chunk: 'BypassResult',
  }) as ActionResult<'BypassResult'>

export type RequestActionOptions<T extends { result: unknown }> = {
  request: IncomingMessage
  response: ServerResponse
  injector: Injector
} & (T extends {
  result: unknown
  body: infer U
}
  ? { getBody: () => Promise<U> }
  : unknown) &
  (T extends { result: unknown; url: infer U } ? { getUrlParams: () => U } : unknown) &
  (T extends { result: unknown; query: infer U } ? { getQuery: () => U } : unknown) &
  (T extends { result: unknown; headers: infer U } ? { headers: U } : unknown)

export type RequestAction<T extends { result: unknown }> = (
  options: RequestActionOptions<T>,
) => Promise<ActionResult<T['result']>>
