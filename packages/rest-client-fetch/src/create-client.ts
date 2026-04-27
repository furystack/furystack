import type { RestApi } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { compile } from 'path-to-regexp'
import { ResponseError } from './response-error.js'
export type BodyParameter<T> = T extends { result: unknown; body: infer U } ? { body: U } : unknown

export type QueryParameter<T> = T extends { result: unknown; query: infer U } ? { query: U } : unknown

export type UrlParameter<T> = T extends { result: unknown; url: infer U } ? { url: U } : unknown

export type HeaderParameter<T> = T extends { result: unknown; headers: infer U } ? { headers: U } : unknown

export type TActionReturns<T> = T extends { result: infer U } ? U : never

export type ReturnType<T> = T extends { result: infer TResult } ? TResult : never

export interface ClientOptions {
  /** Base URL prepended to every request path. */
  endpointUrl: string
  /** `fetch` override (e.g. for tests, or for interceptor wrappers). */
  fetch?: typeof fetch
  /** Forwarded to every underlying `fetch` call (`headers`, `credentials`, `mode`, …). */
  requestInit?: RequestInit
  /** Override for query-string serialization. Default: `serializeToQueryString` from `@furystack/rest`. */
  serializeQueryParams?: (param: any) => string
  /**
   * Called when `response.json()` throws during the default response
   * parser. The result still resolves to `{ result: null }` so callers
   * don't have to wrap every call in try/catch — use this hook for
   * telemetry rather than control flow.
   */
  onResponseParseError?: (options: { response: Response; error: unknown }) => void
}

const parseResponseCore = async <T>(
  response: Response,
  onJsonParseError: (error: unknown) => void,
): Promise<{ response: Response; result: T }> => {
  if (!response.ok) {
    throw new ResponseError(response.statusText, response)
  }

  const contentType = response.headers?.get?.('Content-Type')

  if (contentType?.startsWith('text/')) {
    const result = (await response.text()) as T
    return { response, result }
  }

  if (contentType === 'form/multipart') {
    const result = (await response.formData()) as T
    return { response, result }
  }

  try {
    const result = (await response.json()) as T
    return { response, result }
  } catch (error) {
    onJsonParseError(error)
    return { response, result: null as T }
  }
}

export const defaultResponseParser = async <T>(response: Response): Promise<{ response: Response; result: T }> =>
  parseResponseCore<T>(response, () => {})

const stringifyObjectValues = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value?.toString()]))

export const compileRoute = <T extends Record<string, unknown>>(url: string, params: T) =>
  compile(url)(stringifyObjectValues(params))

const createResponseParser = (onParseError?: ClientOptions['onResponseParseError']) => {
  if (!onParseError) return defaultResponseParser
  return async <T>(response: Response): Promise<{ response: Response; result: T }> =>
    parseResponseCore<T>(response, (error) => onParseError({ response, error }))
}

/**
 * Builds a typed REST client from a {@link RestApi} contract. Each call
 * narrows the `body` / `query` / `url` / `headers` arguments and the
 * returned `result` against the contract entry chosen by `method` +
 * `action`. Throws {@link ResponseError} on non-2xx responses.
 *
 * @example
 * ```ts
 * const client = createClient<MyApi>({ endpointUrl: '/api' })
 * const { result } = await client({ method: 'GET', action: '/users' })
 * ```
 */
export const createClient = <T extends RestApi>(clientOptions: ClientOptions) => {
  const fetchMethod = clientOptions.fetch || fetch
  const responseParser = createResponseParser(clientOptions.onResponseParseError)

  return async <
    TMethod extends keyof T,
    TAction extends keyof T[TMethod],
    TBodyType extends BodyParameter<T[TMethod][TAction]>,
    TQuery extends QueryParameter<T[TMethod][TAction]>,
    TUrlParams extends UrlParameter<T[TMethod][TAction]>,
    TReturns extends ReturnType<T[TMethod][TAction]>,
    THeaders extends HeaderParameter<T[TMethod][TAction]>,
  >(
    options: {
      method: TMethod
      action: TAction
      responseParser?: (response: Response) => Promise<{ response: Response; result: TReturns }>
    } & TBodyType &
      TQuery &
      TUrlParams &
      THeaders,
  ): Promise<{ response: Response; result: TReturns }> => {
    const { url, query, body, headers } = options as unknown as {
      url: TUrlParams
      query: TQuery
      body: TBodyType
      headers: THeaders
    }

    const urlToSend =
      (url ? compileRoute(options.action as string, url) : (options.action as string)) +
      (query
        ? clientOptions.serializeQueryParams
          ? clientOptions.serializeQueryParams(query)
          : `?${serializeToQueryString(query)}`
        : '')

    const response = await fetchMethod(PathHelper.joinUrl(clientOptions.endpointUrl, urlToSend), {
      ...clientOptions.requestInit,
      method: options.method.toString(),
      body: body ? JSON.stringify(body) : undefined,
      ...(headers
        ? {
            headers: {
              ...clientOptions.requestInit?.headers,
              ...headers,
            },
          }
        : {}),
    })

    return (options.responseParser || responseParser)(response)
  }
}
