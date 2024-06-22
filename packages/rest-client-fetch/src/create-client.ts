import type { RestApi } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { compile } from 'path-to-regexp'
import { ResponseError } from './response-error.js'
export type BodyParameter<T> = T extends { result: unknown; body: infer U } ? { body: U } : unknown

export type QueryParameter<T> = T extends { result: unknown; query: infer U } ? { query: U } : unknown

export type UrlParameter<T> = T extends { result: unknown; url: infer U } ? { url: U } : unknown

export type HeaderParameter<T> = T extends { result: unknown; headers: infer U } ? { headers: U } : unknown

export type TActionReturns<T> = T extends { result: infer U } ? U : never

export type ReturnType<T> = T extends { result: infer TResult } ? TResult : never

export interface ClientOptions {
  endpointUrl: string
  fetch?: typeof fetch
  requestInit?: RequestInit
  serializeQueryParams?: (param: any) => string
}

export const defaultResponseParser = async <T>(response: Response): Promise<{ response: Response; result: T }> => {
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
    return { response, result: null as T }
  }
}

const stringifyObjectValues = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value?.toString()]))

export const createClient = <T extends RestApi>(clientOptions: ClientOptions) => {
  const fetchMethod = clientOptions.fetch || fetch

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
    const { url, query, body, headers } = options as any

    const urlToSend =
      (url ? compile(options.action as string)(stringifyObjectValues(url)) : (options.action as string)) +
      (query
        ? clientOptions.serializeQueryParams
          ? clientOptions.serializeQueryParams(query)
          : `?${serializeToQueryString(query)}`
        : '')

    const response = await fetchMethod((clientOptions.endpointUrl + urlToSend) as string, {
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

    return (options.responseParser || defaultResponseParser)(response)
  }
}
