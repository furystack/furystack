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
