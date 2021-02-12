import { RestApi, ActionResult, RequestOptions, serializeToQueryString } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { compile } from 'path-to-regexp'
import got, { Options as GotOptions, Response as GotResponse } from 'got'

export type BodyParameter<T> = T extends (
  options: RequestOptions<any, infer TBody, any, any>,
) => Promise<ActionResult<any>>
  ? TBody
  : unknown

export type QueryParameter<T> = T extends (
  options: RequestOptions<infer TQuery, any, any, any>,
) => Promise<ActionResult<any>>
  ? TQuery
  : unknown

export type UrlParameter<T> = T extends (
  options: RequestOptions<any, any, infer TUrlParams, any>,
) => Promise<ActionResult<any>>
  ? TUrlParams
  : unknown

export type Header<T> = T extends (options: RequestOptions<any, any, any, infer THeaders>) => Promise<ActionResult<any>>
  ? THeaders
  : unknown

export type ReturnType<T> = T extends (options: any) => Promise<ActionResult<infer TResult>> ? TResult : never

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
    THeaders extends Header<T[TMethod][TAction]>
  >(
    options: {
      method: TMethod
      action: TAction
    } & (unknown extends TBodyType ? {} : { body: TBodyType }) &
      (unknown extends TQuery ? {} : { query: TQuery }) &
      (unknown extends TUrlParams ? {} : { url: TUrlParams }) &
      (unknown extends THeaders ? {} : { headers: THeaders }),
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
