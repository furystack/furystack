import type { Injector } from '@furystack/inject'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * The shape returned by every {@link RequestAction}. Consumed by the runtime
 * to write the response (`statusCode`, `headers`, serialized `chunk`).
 */
export interface ActionResult<T> {
  statusCode: number
  headers: { [K: string]: string }
  chunk: T
}

/** {@link ActionResult} with `application/json`. Default status 200. */
export const JsonResult = <T extends object>(chunk: T, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  }) as ActionResult<T>

/** {@link ActionResult} with `plain/text`. Default status 200. */
export const PlainTextResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'plain/text',
    },
  }) as ActionResult<string>

/** {@link ActionResult} with `application/xml;charset=utf-8`. Default status 200. */
export const XmlResult = (text: string, statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    chunk: text,
    headers: {
      ...headers,
      'Content-Type': 'application/xml;charset=utf-8',
    },
  }) as ActionResult<string>

/** {@link ActionResult} with no body. Use for `204 No Content` responses. */
export const EmptyResult = (statusCode = 200, headers?: { [K: string]: string }) =>
  ({
    statusCode,
    headers: {
      ...headers,
    },
  }) as ActionResult<undefined>

/**
 * Sentinel result that signals "skip this action; let the runtime fall
 * through to the next matching handler (or 404 if none)". Returned from
 * an action when it decides not to handle the request after inspection.
 */
export const BypassResult = () =>
  ({
    chunk: 'BypassResult',
  }) as ActionResult<'BypassResult'>

/**
 * Argument shape passed to a {@link RequestAction}. Conditional members
 * (`getBody`, `getUrlParams`, `getQuery`, `headers`) are present only when
 * the action's contract declares the corresponding key — keeping unrelated
 * actions free of unused parser allocations.
 */
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

/**
 * Server-side implementation of a typed REST endpoint contract `T` (declared
 * via `@furystack/rest`). Receives {@link RequestActionOptions} narrowed to
 * the contract's body/url/query/headers and resolves to an {@link ActionResult}
 * carrying the contract's `result` shape.
 */
export type RequestAction<T extends { result: unknown }> = (
  options: RequestActionOptions<T>,
) => Promise<ActionResult<T['result']>>
