import type { BlobStore, BlobRef } from '@furystack/blob-store'
import type { Injector } from '@furystack/inject'
import type { ChildHandle } from './child-handle.js'

export type SpawnOptions = {
  retentionPolicy?: {
    onSuccess?: 'keep' | 'delete-intermediate' | 'delete-all'
    onFailure?: 'keep' | 'delete-all'
    ttlAfterTerminalDays?: number
  }
  tags?: string[]
}

/**
 * Per-child outcome returned by {@link TaskContext.awaitChildrenSettled}.
 *
 * Unlike {@link TaskContext.awaitChildren} — which rejects on the first
 * non-succeeded child — the settled variant resolves with one of these
 * discriminants per child so a handler can decide per child. `cancelled`
 * is kept distinct from `failed` (a `PromiseSettledResult` would fold both
 * into `rejected`); the `taskId` / `type` are echoed back so callers can
 * correlate without re-zipping against the original handles.
 */
export type SettledChildResult<TResult = unknown> =
  | { status: 'succeeded'; taskId: string; type: string; result: TResult }
  | { status: 'failed'; taskId: string; type: string; error: { name: string; message: string } }
  | { status: 'cancelled'; taskId: string; type: string }

/**
 * Context passed to every task handler invocation. Provides DI access,
 * blob storage, DAG primitives, determinism-safe helpers, and a
 * cancellation signal.
 */
export type TaskContext<TPayload = unknown> = {
  readonly taskId: string
  readonly attempt: number
  readonly payload: TPayload
  readonly injector: Injector
  readonly blobStore: BlobStore

  heartbeat(): Promise<void>
  reportProgress(progress: { percent: number; meta?: Record<string, unknown> }): void

  spawnChild<TIn, TOut>(type: string, payload: TIn, opts?: SpawnOptions): Promise<ChildHandle<TOut>>
  awaitChildren<THandles extends Array<ChildHandle<unknown>>>(
    handles: THandles,
  ): Promise<{ [K in keyof THandles]: THandles[K] extends ChildHandle<infer R> ? R : never }>
  /**
   * Like {@link TaskContext.awaitChildren}, but resolves to a per-child
   * {@link SettledChildResult} instead of rejecting on the first failed or
   * cancelled child. Suspends (replay) until every child is terminal, then
   * returns a tuple positionally matching `handles`. Use it when a handler
   * must inspect partial results and decide what to do per child.
   *
   * @example
   * ```ts
   * import { defineTaskHandler } from '@furystack/task-runner'
   *
   * const fanOut = defineTaskHandler({
   *   type: 'fan-out',
   *   version: 1,
   *   handler: async (ctx, payload: { ids: string[] }) => {
   *     const handles = await Promise.all(payload.ids.map((id) => ctx.spawnChild<string, number>('scan', id)))
   *     const settled = await ctx.awaitChildrenSettled(handles)
   *     const ok = settled.filter((r) => r.status === 'succeeded').map((r) => r.result)
   *     return { scanned: ok.length, total: settled.length }
   *   },
   * })
   * ```
   */
  awaitChildrenSettled<THandles extends Array<ChildHandle<unknown>>>(
    handles: THandles,
  ): Promise<{ [K in keyof THandles]: THandles[K] extends ChildHandle<infer R> ? SettledChildResult<R> : never }>
  spawnChildAndAwait<TIn, TOut>(type: string, payload: TIn, opts?: SpawnOptions): Promise<TOut>

  allocateBlob(suffix: string, opts?: { contentType?: string }): BlobRef

  readonly cancellationSignal: AbortSignal

  now(): Date
  random(): number
  sleep(ms: number): Promise<void>

  /**
   * Determinism-safe `fetch`. On first execution the request runs against
   * the global `fetch`, the response body is fully buffered, and
   * `{ status, statusText, headers, body }` is recorded on the replay log;
   * on replay the recorded response is returned without a network call.
   *
   * Constraints: the body is buffered (no streaming) and stored base64 on
   * the replay log, so very large responses bloat the log / hit row-size
   * limits — keep handler `fetch` responses modest. `input` is limited to
   * `string | URL` (not a `Request`) so the call is recordable.
   */
  fetch(input: string | URL, init?: RequestInit): Promise<Response>
}
