import type { SyncVersion } from '@furystack/entity-sync'

/**
 * Per-model monotonic sequence source consumed by
 * `SubscriptionManager`. The default in-process implementation keeps
 * one counter per `modelName`, matching today's behavior.
 *
 * Extracted as an internal seam so a future cross-node bus adapter can
 * swap in a server-assigned sequence (Redis Streams, NATS JetStream)
 * without touching the broadcaster — the manager keeps calling
 * `next(modelName)` and `current(modelName)`, only the factory
 * registered on construction changes.
 *
 * Not part of the public API surface; not re-exported from `index.ts`.
 * Exists to make the milestone-3 swap a factory swap.
 *
 * @internal
 */
export interface SequenceGenerator {
  /**
   * Allocates the next `SyncVersion` for `modelName`. The returned
   * `seq` is strictly greater than every value previously returned
   * for the same `modelName` from this generator instance.
   */
  next(modelName: string): SyncVersion
  /**
   * Returns the most recently allocated seq for `modelName`, or `0`
   * when no seq has been allocated yet. Used by the broadcaster to
   * stamp the version on collection-snapshot messages and to seed a
   * new subscription's `currentSeq`.
   */
  current(modelName: string): number
}

/**
 * Default {@link SequenceGenerator} implementation: one in-memory
 * counter per `modelName`, scoped to a single process. Each
 * `SubscriptionManager` instance owns one generator, so per-model
 * counters reset on process restart — matching the pre-extraction
 * behavior.
 */
export const createInProcessSequenceGenerator = (): SequenceGenerator => {
  const counters = new Map<string, number>()
  return {
    next(modelName) {
      const next = (counters.get(modelName) ?? 0) + 1
      counters.set(modelName, next)
      return {
        seq: next,
        timestamp: new Date().toISOString(),
      }
    },
    current(modelName) {
      return counters.get(modelName) ?? 0
    },
  }
}
