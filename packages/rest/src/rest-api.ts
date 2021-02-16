import { Method } from './methods'

export type RestApi = {
  [TUrl in `/${string}`]: {
    [TMethod in Method]?: { result?: unknown; url?: unknown; query?: unknown; body?: unknown; headers?: unknown }
  }
}
