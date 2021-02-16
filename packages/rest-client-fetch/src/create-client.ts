import { RestApi } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { ResponseError } from './response-error'
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
    TAction extends keyof T,
    TMethod extends keyof T[TAction],
    TBodyType extends BodyParameter<T[TAction][TMethod]>,
    TQuery extends QueryParameter<T[TAction][TMethod]>,
    TUrlParams extends UrlParameter<T[TAction][TMethod]>,
    TReturns extends ReturnType<T[TAction][TMethod]>,
    THeaders extends HeaderParameter<T[TAction][TMethod]>
  >(
    options: {
      method: TMethod
      action: TAction
    } & TBodyType &
      TQuery &
      TUrlParams &
      THeaders,
  ): Promise<TReturns> => {
    const { url, query, body, headers } = options as any

    const urlToSend =
      (url ? compile(options.action as string)(url) : options.action) +
      (query
        ? `?${Object.keys(query)
            .map(
              (key) =>
                `${key}=${
                  clientOptions.serializeQueryParams ? clientOptions.serializeQueryParams(query[key]) : query[key]
                }`,
            )
            .join('&')}`
        : '')

    const result = await fetchMethod(PathHelper.joinPaths(clientOptions.endpointUrl, urlToSend as string), {
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
    if (!result.ok) {
      throw new ResponseError(result.statusText, result)
    }
    const responseBody = await result.json()
    return responseBody
  }
}
