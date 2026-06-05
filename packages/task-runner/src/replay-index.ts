import type { TaskReplayLogEntry } from './types.js'

/**
 * O(1) lookup over the replay log: a `Map<stepIndex, entry>` built once per
 * handler invocation. Replaces an O(n²) per-step linear scan.
 */
export type ReplayIndex = Map<number, TaskReplayLogEntry>

/** Builds a {@link ReplayIndex} from a task's replay-log entries. */
export const buildReplayIndex = (log: TaskReplayLogEntry[]): ReplayIndex => {
  const index: ReplayIndex = new Map()
  for (const entry of log) index.set(entry.stepIndex, entry)
  return index
}
