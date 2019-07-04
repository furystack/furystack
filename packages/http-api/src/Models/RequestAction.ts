/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
import { Injector } from '@furystack/inject'

export interface ActionResult<T> {
  statusCode: number
  headers: { [K: string]: string }
  chunk: T
}

export const JsonResult = <T extends object>(chunk: T, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: JSON.stringify(chunk),
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  } as ActionResult<string>)

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

/**
 * Interface for a HTTP Request action
 */
export type RequestAction = (i: Injector) => Promise<ActionResult<any>>
