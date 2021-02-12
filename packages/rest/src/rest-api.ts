import { Method } from './methods'
import { RequestAction } from './request-action'

export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: RequestAction<{ result: unknown }>
  }
}
