import { RestApi, serializeToQueryString } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { compile } from 'path-to-regexp'
import got, { Options as GotOptions, Response as GotResponse } from 'got'

export type BodyParameter<T> = T extends { result: unknown; body: infer U } ? { body: U } : unknown

export type QueryParameter<T> = T extends { result: unknown; query: infer U } ? { query: U } : unknown

export type UrlParameter<T> = T extends { result: unknown; url: infer U } ? { url: U } : unknown

export type HeaderParameter<T> = T extends { result: unknown; headers: infer U } ? { headers: U } : unknown

export type TActionReturns<T> = T extends { result: infer U } ? U : never

export type ReturnType<T> = T extends { result: infer TResult } ? TResult : never

export interface ClientOptions {
  endpointUrl: string
  got?: typeof got
  gotOptions?: GotOptions
  serializeQueryParams?: (param: any) => string
}

export const createClient = <T extends RestApi>(clientOptions: ClientOptions) => {
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
  ): Promise<{ response: GotResponse<TReturns>; getJson: () => TReturns }> => {
    const { url, query, body, headers } = options as any

    const urlToSend =
      (url ? compile(options.action as string)(url) : options.action) +
      (query
        ? clientOptions.serializeQueryParams
          ? clientOptions.serializeQueryParams(query)
          : `?${serializeToQueryString(query)}`
        : '')

    const response = (await (clientOptions?.got || got)(
      PathHelper.joinPaths(clientOptions.endpointUrl, urlToSend as string),
      {
        ...clientOptions.gotOptions,
        method: options.method.toString() as any,
        body: body ? JSON.stringify(body) : undefined,
        ...(headers
          ? {
              headers: {
                ...clientOptions.gotOptions?.headers,
                ...headers,
              },
            }
          : {}),
      },
    )) as GotResponse<TReturns>

    return {
      response,
      getJson: () => JSON.parse(response.body as string) as TReturns,
    }
  }
}
