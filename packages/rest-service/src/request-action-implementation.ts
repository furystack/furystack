import { Injector } from '@furystack/inject'
import { ServerResponse } from 'http'
import { IncomingMessage } from 'http'

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

export type RequestActionOptions<T> = {
  request: IncomingMessage
  response: ServerResponse
  injector: Injector
} & (T extends {
  body: infer U
}
  ? { getBody: () => Promise<U> }
  : unknown) &
  (T extends { url: infer U } ? { getUrlParams: () => U } : unknown) &
  (T extends { query: infer U } ? { getQuery: () => U } : unknown) &
  (T extends { headers: infer U } ? { headers: U } : unknown)

export type RequestAction<T extends { result: unknown }> = (
  options: RequestActionOptions<T>,
) => Promise<ActionResult<T['result']>>
