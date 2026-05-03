import { ReplayWindowExceededError, type CrossNodeBus } from '@furystack/cross-node-bus'
import type { SyncChangeEntry, SyncVersion } from '@furystack/entity-sync'
import type { EntityChange } from './entity-change-bus.js'
import { topicForModel } from './entity-change-bus.js'

/**
 * Per-model history of recent {@link SyncChangeEntry}s consumed by
 * `SubscriptionManager` to answer reconnecting-client delta requests.
 *
 * Backed by {@link CrossNodeBus.replay}: the bus owns the retention window
 * (in-process ring buffer; Redis Streams `MAXLEN`; etc.) and assigns the
 * monotonic seq, so this interface is a thin shape-translator that converts
 * `BusMessage` to the wire-format `SyncChangeEntry` the broadcaster already
 * speaks.
 *
 * Not part of the public API surface; not re-exported from `index.ts`.
 *
 * @internal
 */
export interface ChangeLog {
  /**
   * Returns the oldest retained seq for `modelName`, or `undefined` when
   * nothing is currently retained for that model. Callers compare against a
   * client's `lastSeq` to decide whether the gap can be served from the
   * bus's retained window or requires a full snapshot fallback.
   */
  oldestSeq(modelName: string): string | undefined
  /**
   * Yields every retained {@link SyncChangeEntry} for `modelName` whose `seq`
   * is **strictly greater** than `fromSeq`, in the bus's emission order.
   * Throws (or yields an error on first iteration)
   * {@link ReplayWindowExceededError} when `fromSeq` is older than the
   * adapter's retained window — callers fall back to a full snapshot.
   */
  since(modelName: string, fromSeq: string): AsyncIterable<SyncChangeEntry>
}

const toSyncChangeEntry = (change: EntityChange, version: SyncVersion): SyncChangeEntry => {
  switch (change.type) {
    case 'added':
      return { type: 'added', entity: change.entity, version }
    case 'updated':
      return { type: 'updated', id: change.id, change: change.change, version }
    case 'removed':
      return { type: 'removed', id: change.id, version }
    default: {
      // Exhaustiveness check: every variant of {@link EntityChange} above must
      // be handled. Adding a new variant without updating this switch will
      // fail to compile.
      const _exhaustive: never = change
      throw new Error(`Unhandled EntityChange variant: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

const isEntityChange = (value: unknown): value is EntityChange => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { type?: unknown }
  return candidate.type === 'added' || candidate.type === 'updated' || candidate.type === 'removed'
}

/**
 * Default {@link ChangeLog} implementation: thin wrapper over
 * {@link CrossNodeBus.replay} and {@link CrossNodeBus.oldestSeq}. The bus
 * owns the retention window, the seq counter, and (via the adapter) the
 * eviction policy — the wrapper only translates the topic name and shape.
 *
 * `since` invokes {@link CrossNodeBus.replay} eagerly so that
 * {@link ReplayWindowExceededError} surfaces synchronously to the caller —
 * matching the bus contract and keeping the "delta vs snapshot" decision a
 * straight try/catch around the call site rather than a try/catch around an
 * async iterator.
 */
export const createBusBackedChangeLog = (bus: CrossNodeBus): ChangeLog => ({
  oldestSeq(modelName) {
    return bus.oldestSeq(topicForModel(modelName))
  },
  since(modelName, fromSeq) {
    const iterable = bus.replay(topicForModel(modelName), fromSeq)
    return (async function* iterate(): AsyncIterable<SyncChangeEntry> {
      for await (const message of iterable) {
        if (message.seq === undefined) continue
        if (!isEntityChange(message.payload)) continue
        yield toSyncChangeEntry(message.payload, { seq: message.seq, timestamp: message.emittedAt })
      }
    })()
  },
})
