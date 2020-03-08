import { RestApi, ActionResult, RequestOptions } from '@furystack/rest'
import { ResponseError } from './response-error'

export type BodyParameter<T> = T extends (options: RequestOptions<any, infer TBody>) => Promise<ActionResult<any>>
  ? TBody
  : never

export type ResponseParameter<T> = T extends (
  options: RequestOptions<any, any>,
) => Promise<ActionResult<infer TResponse>>
  ? TResponse
  : never

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
    TParamType extends BodyParameter<T[TMethod][TAction]>
  >(options: {
    method: TMethod
    action: TAction
    body: TParamType
  }): Promise<ResponseParameter<T[TMethod][TAction]>> => {
    const result = await fetchMethod(clientOptions.endpointUrl, {
      ...clientOptions.requestInit,
      method: options.method.toString(),
      body: JSON.stringify(options.body),
    })
    if (!result.ok) {
      throw new ResponseError(result.statusText, result)
    }
    const body = await result.json()
    return body
  }
}
