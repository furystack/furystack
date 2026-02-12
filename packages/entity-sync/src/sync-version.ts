/**
 * Version metadata included in all server sync messages.
 * Every change to a model increments the seq and records a timestamp.
 */
export type SyncVersion = {
  /** Monotonically increasing sequence number per model */
  seq: number
  /** ISO 8601 timestamp, used for time-based changelog pruning */
  timestamp: string
}
