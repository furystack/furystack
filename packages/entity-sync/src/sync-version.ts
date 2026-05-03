/**
 * Version metadata included in all server sync messages.
 *
 * `seq` is an **opaque, ordered token** assigned by the server's underlying
 * cross-node bus adapter — the broadcaster never invents the value, it only
 * forwards what the bus stamps on each message. Clients **must not** compare
 * seqs lexicographically or numerically: the only safe operations are
 * round-tripping the value back to the server (via `lastSeq` on
 * `ClientSyncMessage`) and equality. The string encoding lets adapters use
 * native id formats — e.g. integer counters in-process, `<ms>-<n>` Redis
 * Stream ids — without a translation layer.
 */
export type SyncVersion = {
  /** Adapter-assigned, opaque, ordered per-topic identifier. */
  seq: string
  /** ISO 8601 timestamp, used for time-based changelog pruning */
  timestamp: string
}
