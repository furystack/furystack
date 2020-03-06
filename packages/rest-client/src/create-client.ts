import { RestApi } from '@furystack/rest'

export interface ClientOptions {
  fetch: (...args: any[]) => any
}

export const createClient = <T extends RestApi>(clientOptions: ClientOptions) => {
  return <TMethod extends keyof T, TEndpoint extends keyof T[TMethod]>(options: {
    method: TMethod
    endpoint: TEndpoint
    param: Parameters<T[TMethod][TEndpoint]>[0]
  }): ReturnType<T[TMethod][TEndpoint]> => {
    return clientOptions.fetch(options.param)
  }
}
