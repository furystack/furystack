import type { SyncVersion } from './sync-version.js'

/**
 * A single entry in a delta replay, representing one change to an entity
 */
export type SyncChangeEntry =
  | { type: 'added'; entity: unknown; version: SyncVersion }
  | { type: 'updated'; id: unknown; change: Record<string, unknown>; version: SyncVersion }
  | { type: 'removed'; id: unknown; version: SyncVersion }
