import type { TaskContext } from './task-context.js'
import type { RetryPolicy } from './retry-policy.js'
import type { TaskRetentionPolicy } from './types.js'
import { DEFAULT_RETRY_POLICY } from './retry-policy.js'
import { DEFAULT_RETENTION_POLICY } from './types.js'

export type TaskHandlerDescriptor<TPayload = unknown, TResult = unknown> = {
  readonly type: string
  readonly version: number
  readonly retryPolicy: RetryPolicy
  readonly retentionPolicy: TaskRetentionPolicy
  readonly cancelOnDrain: boolean
  readonly visibilityTimeoutMs: number
  readonly progressThrottleMs: number
  readonly handler: (ctx: TaskContext<TPayload>, payload: TPayload) => Promise<TResult>
}

/**
 * Existential storage alias for heterogeneous handler descriptors. Maps and
 * arrays that hold descriptors with different `TPayload` / `TResult` need
 * `any` because both type parameters appear in contravariant (handler param)
 * and covariant (handler return) positions — `unknown` cannot model that.
 *
 * Use this alias instead of inlining `TaskHandlerDescriptor<any, any>` so the
 * variance escape hatch is named, greppable, and disabled in one place.
 */
export type AnyTaskHandlerDescriptor = TaskHandlerDescriptor<any, any>

export type DefineTaskHandlerOptions<TPayload, TResult> = {
  type: string
  version: number
  retryPolicy?: Partial<RetryPolicy>
  retentionPolicy?: Partial<TaskRetentionPolicy>
  cancelOnDrain?: boolean
  visibilityTimeoutMs?: number
  progressThrottleMs?: number
  handler: (ctx: TaskContext<TPayload>, payload: TPayload) => Promise<TResult>
}

/**
 * Builds a {@link TaskHandlerDescriptor} with defaults filled in. The
 * handler runs inside a worker; it is replay-safe and may use
 * {@link TaskContext.spawnChild} / {@link TaskContext.awaitChildren} to
 * compose DAGs.
 *
 * @example
 * ```typescript
 * const encodeHandler = defineTaskHandler<
 *   { inputBlob: BlobRef; preset: string },
 *   { outputBlob: BlobRef }
 * >({
 *   type: 'video-encode',
 *   version: 1,
 *   retryPolicy: { maxAttempts: 3, backoff: 'exponential', baseDelayMs: 1_000, jitter: 0.2 },
 *   visibilityTimeoutMs: 5 * 60_000,
 *   handler: async (ctx, { inputBlob, preset }) => {
 *     ctx.reportProgress({ percent: 10 })
 *     const outputBlob = ctx.allocateBlob('out.mp4', { contentType: 'video/mp4' })
 *     // ... do the work, occasionally calling ctx.heartbeat() and ctx.reportProgress()
 *     return { outputBlob }
 *   },
 * })
 * ```
 */
export const defineTaskHandler = <TPayload = unknown, TResult = unknown>(
  options: DefineTaskHandlerOptions<TPayload, TResult>,
): TaskHandlerDescriptor<TPayload, TResult> => ({
  type: options.type,
  version: options.version,
  retryPolicy: { ...DEFAULT_RETRY_POLICY, ...options.retryPolicy },
  retentionPolicy: { ...DEFAULT_RETENTION_POLICY, ...options.retentionPolicy },
  cancelOnDrain: options.cancelOnDrain ?? false,
  visibilityTimeoutMs: options.visibilityTimeoutMs ?? 60_000,
  progressThrottleMs: options.progressThrottleMs ?? 250,
  handler: options.handler,
})
