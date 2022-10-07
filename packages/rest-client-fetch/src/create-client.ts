import type { RestApi } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { ResponseError } from './response-error.js'
import { compile } from 'path-to-regexp'
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
    } & TBodyType &
      TQuery &
      TUrlParams &
      THeaders,
  ): Promise<{ response: Response; result: TReturns }> => {
    const { url, query, body, headers } = options as any

    const urlToSend =
      (url ? compile(options.action as string)(url) : (options.action as string)) +
      (query
        ? clientOptions.serializeQueryParams
          ? clientOptions.serializeQueryParams(query)
          : `?${serializeToQueryString(query)}`
        : '')

    const response = await fetchMethod(PathHelper.joinPaths(clientOptions.endpointUrl, urlToSend as string), {
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
    if (!response.ok) {
      throw new ResponseError(response.statusText, response)
    }

    const contentType = response.headers?.get?.('Content-Type')

    if (contentType?.startsWith('text/')) {
      const result = (await response.text()) as TReturns
      return { response, result }
    }

    if (contentType === 'form/multipart') {
      const result = (await response.formData()) as TReturns
      return { response, result }
    }

    try {
      const result = (await response.json()) as TReturns
      return { response, result }
    } catch (error) {
      return { response, result: null as TReturns }
    }
  }
}
