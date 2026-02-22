import type { SyncChangeEntry } from './sync-change-entry.js'
import type { SyncVersion } from './sync-version.js'

/**
 * Messages sent from server to client over the WebSocket sync protocol
 */
export type ServerSyncMessage =
  | {
      type: 'subscribed'
      requestId: string
      subscriptionId: string
      model: string
      /** The primary key field name (included for collection subscriptions) */
      primaryKey?: string
      mode: 'snapshot'
      data: unknown
      /** Total count of matching entities (ignoring top/skip). Included for collection subscriptions. */
      totalCount?: number
      version: SyncVersion
    }
  | {
      type: 'subscribed'
      requestId: string
      subscriptionId: string
      model: string
      /** The primary key field name (included for collection subscriptions) */
      primaryKey?: string
      mode: 'delta'
      changes: SyncChangeEntry[]
      /** Total count of matching entities (ignoring top/skip). Included for collection subscriptions. */
      totalCount?: number
      version: SyncVersion
    }
  | {
      type: 'entity-added'
      subscriptionId: string
      entity: unknown
      version: SyncVersion
    }
  | {
      type: 'entity-updated'
      subscriptionId: string
      id: unknown
      change: Record<string, unknown>
      version: SyncVersion
    }
  | {
      type: 'entity-removed'
      subscriptionId: string
      id: unknown
      version: SyncVersion
    }
  | {
      type: 'collection-snapshot'
      subscriptionId: string
      data: unknown[]
      totalCount: number
      version: SyncVersion
    }
  | {
      type: 'subscription-error'
      requestId: string
      error: string
    }
