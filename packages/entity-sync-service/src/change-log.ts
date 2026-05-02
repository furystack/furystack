import type { SyncChangeEntry } from '@furystack/entity-sync'

/**
 * Per-model bounded log of recent {@link SyncChangeEntry}s consumed by
 * `SubscriptionManager` to answer reconnecting-client delta requests.
 * The default in-process implementation keeps one array per
 * `modelName` with a wall-clock retention window, matching today's
 * behavior.
 *
 * Extracted as an internal seam so a future cross-node bus adapter
 * (Redis Streams `XRANGE`, NATS JetStream) can plug in a replay-backed
 * implementation without touching the broadcaster — the manager keeps
 * calling `append` / `oldestSeq` / `since`, only the factory
 * registered on construction changes.
 *
 * Not part of the public API surface; not re-exported from
 * `index.ts`. Exists to make the milestone-3 swap a factory swap.
 */
export interface ChangeLog {
  /**
   * Registers retention for `modelName`. Idempotent — re-configuring
   * an already-known model overwrites the retention window without
   * dropping existing entries. Must be called once per model before
   * `append`.
   */
  configure(modelName: string, retentionMs: number): void
  /** Appends `entry` to the log for `modelName`. */
  append(modelName: string, entry: SyncChangeEntry): void
  /**
   * Returns the lowest `seq` currently retained for `modelName`, or
   * `undefined` when the log is empty. Callers compare against a
   * client's `lastSeq` to decide whether the gap can be served from
   * the log or requires a full snapshot fallback.
   */
  oldestSeq(modelName: string): number | undefined
  /**
   * Returns every retained entry for `modelName` whose `seq` is
   * **strictly greater** than `fromSeq`, in append order. Returns an
   * empty array when no such entries exist. The caller filters by
   * subscription key — this method intentionally does not.
   */
  since(modelName: string, fromSeq: number): readonly SyncChangeEntry[]
  /** Current entry count for `modelName`. Diagnostic / test use. */
  length(modelName: string): number
}

interface ModelLog {
  entries: SyncChangeEntry[]
  retentionMs: number
}

/**
 * Default {@link ChangeLog} implementation: per-model array with
 * wall-clock retention. Pruning runs on every `append` and `since`
 * call, so a quiet model carrying stale entries does not surface
 * them to a reconnecting client.
 */
export const createInProcessChangeLog = (): ChangeLog => {
  const logs = new Map<string, ModelLog>()

  const prune = (log: ModelLog): void => {
    const cutoff = Date.now() - log.retentionMs
    log.entries = log.entries.filter((entry) => new Date(entry.version.timestamp).getTime() > cutoff)
  }

  return {
    configure(modelName, retentionMs) {
      const existing = logs.get(modelName)
      if (existing) {
        existing.retentionMs = retentionMs
        return
      }
      logs.set(modelName, { entries: [], retentionMs })
    },
    append(modelName, entry) {
      const log = logs.get(modelName)
      if (!log) {
        throw new Error(`ChangeLog: model '${modelName}' is not configured`)
      }
      log.entries.push(entry)
      prune(log)
    },
    oldestSeq(modelName) {
      const log = logs.get(modelName)
      if (!log || log.entries.length === 0) return undefined
      prune(log)
      return log.entries[0]?.version.seq
    },
    since(modelName, fromSeq) {
      const log = logs.get(modelName)
      if (!log || log.entries.length === 0) return []
      prune(log)
      return log.entries.filter((entry) => entry.version.seq > fromSeq)
    },
    length(modelName) {
      return logs.get(modelName)?.entries.length ?? 0
    },
  }
}
