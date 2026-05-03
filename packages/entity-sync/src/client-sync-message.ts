import type { FilterType } from '@furystack/core'

/**
 * Messages sent from client to server over the WebSocket sync protocol.
 * The `model` field is derived from `constructor.name` on both sides.
 */
export type ClientSyncMessage =
  | {
      type: 'subscribe-entity'
      requestId: string
      model: string
      key: unknown
      lastSeq?: string
    }
  | {
      type: 'subscribe-collection'
      requestId: string
      model: string
      filter?: FilterType<unknown>
      top?: number
      skip?: number
      order?: Record<string, 'ASC' | 'DESC'>
      lastSeq?: string
    }
  | {
      type: 'unsubscribe'
      subscriptionId: string
    }
