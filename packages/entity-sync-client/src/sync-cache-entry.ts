/**
 * Entry persisted in the local cache store for stale-while-revalidate and delta sync
 */
export type SyncCacheEntry = {
  /** Unique key for this subscription, e.g. 'User:123' or 'ChatMessage:collection:{...}' */
  subscriptionKey: string
  /** Wire name of the model (derived from constructor.name) */
  model: string
  /** Last received sequence number from the server */
  lastSeq: number
  /** Cached entity data (single entity or entity array) */
  data: unknown
  /** ISO 8601 timestamp of when this cache entry was last updated */
  timestamp: string
}

/**
 * Minimal store interface for local caching of sync state.
 * Use createInMemoryCacheStore() for an in-memory implementation,
 * or implement this interface for persistent storage (e.g., IndexedDB).
 */
export type SyncCacheStore = {
  /** Retrieves a cached entry by subscription key */
  get(key: string): Promise<SyncCacheEntry | undefined>
  /** Persists or updates a cache entry */
  set(key: string, entry: SyncCacheEntry): Promise<void>
}

/**
 * Creates an in-memory SyncCacheStore backed by a Map.
 * Data is retained for the lifetime of the store instance.
 * For persistence across page reloads, use an IndexedDB-based implementation.
 */
export const createInMemoryCacheStore = (): SyncCacheStore => {
  const cache = new Map<string, SyncCacheEntry>()
  return {
    get: async (key) => cache.get(key),
    set: async (key, entry) => {
      cache.set(key, entry)
    },
  }
}
