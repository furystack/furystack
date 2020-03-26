import { RestApi, ActionResult, RequestOptions } from '@furystack/rest'
import { PathHelper } from '@furystack/utils'
import { ResponseError } from './response-error'
import { compile } from 'path-to-regexp'

export type BodyParameter<T> = T extends (options: RequestOptions<any, infer TBody, any>) => Promise<ActionResult<any>>
  ? TBody
  : unknown

export type QueryParameter<T> = T extends (
  options: RequestOptions<infer TQuery, any, any>,
) => Promise<ActionResult<any>>
  ? TQuery
  : unknown

export type UrlParameter<T> = T extends (
  options: RequestOptions<any, any, infer TUrlParams>,
) => Promise<ActionResult<any>>
  ? TUrlParams
  : unknown

export type ReturnType<T> = T extends (options: any) => Promise<ActionResult<infer TResult>> ? TResult : never

export interface ClientOptions {
  endpointUrl: string
  fetch?: typeof fetch
  requestInit?: RequestInit
}

export const createClient = <T extends RestApi>(clientOptions: ClientOptions) => {
  const fetchMethod = clientOptions.fetch || fetch

  return async <
    TMethod extends keyof T,
    TAction extends keyof T[TMethod],
    TBodyType extends BodyParameter<T[TMethod][TAction]>,
    TQuery extends QueryParameter<T[TMethod][TAction]>,
    TUrlParams extends UrlParameter<T[TMethod][TAction]>,
    TReturns extends ReturnType<T[TMethod][TAction]>
  >(
    options: {
      method: TMethod
      action: TAction
    } & (unknown extends TBodyType ? {} : { body: TBodyType }) &
      (unknown extends TQuery ? {} : { query: TQuery }) &
      (unknown extends TUrlParams ? {} : { url: TUrlParams }),
  ): Promise<TReturns> => {
    const { url, query, body } = options as any

    const urlToSend =
      (url ? compile(options.action as string)(url) : options.action) +
      (query
        ? `?${Object.keys(query)
            .map((key) => `${key}=${query[key]}`)
            .join('&')}`
        : '')

    const result = await fetchMethod(PathHelper.joinPaths(clientOptions.endpointUrl, urlToSend as string), {
      ...clientOptions.requestInit,
      method: options.method.toString(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!result.ok) {
      throw new ResponseError(result.statusText, result)
    }
    const responseBody = await result.json()
    return responseBody
  }
}
