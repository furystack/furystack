import type { Method } from './methods.js'

export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: { result: unknown; url?: unknown; query?: unknown; body?: unknown; headers?: unknown }
  }
}
