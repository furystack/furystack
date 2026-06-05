import type { BlobUploadUrl } from '@furystack/blob-store'
import type { Task } from '@furystack/task-runner'
import type { ObservableValue } from '@furystack/utils'

/**
 * Body shapes accepted by {@link uploadBlob} / upload slots. Mirrors the
 * subset of the Fetch `BodyInit` union that makes sense for blob payloads.
 */
export type BlobBody = Blob | ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array> | string

/**
 * A caller-named upload slot passed to {@link TaskRunnerClient.submitTask}.
 * `body` is uploaded to the presigned URL minted by the server; the other
 * fields are forwarded to the server so it can size/scope the ticket.
 */
export type UploadSlot = {
  body: BlobBody
  contentType?: string
  maxBytes?: number
  ttlSec?: number
}

/**
 * Options for {@link TaskRunnerClient.submitTask}. Drives the two-phase
 * REST flow (draft → upload → start). When `uploads` is supplied, the
 * client mints a draft, uploads each slot to its presigned URL, then
 * resolves the final payload via {@link SubmitTaskOptions.resolvePayload}
 * before starting the task.
 */
export type SubmitTaskOptions<TPayload> = {
  type: string
  payload: TPayload
  handlerVersion: number
  idempotencyKey?: string
  /** Held until this instant before dispatch. `Date` or ISO-8601 string. */
  notBefore?: Date | string
  tags?: string[]
  retentionPolicy?: Task['retentionPolicy']
  uploads?: Record<string, UploadSlot>
  /**
   * Maps the server-allocated upload keys back into the payload before the
   * task is started. Receives the original `payload` plus a record of
   * `slotName → blobKey`. Required to make uploaded blobs reachable from
   * the handler payload; when omitted the original payload is started
   * unchanged.
   */
  resolvePayload?: (ctx: { payload: TPayload; uploadedKeys: Record<string, string> }) => TPayload
}

/**
 * Live view of a subscribed task. `state` folds the WS snapshot together
 * with the hot-lane `task-update` stream so observers always read the
 * latest known task row. Dispose to unsubscribe.
 */
export type LiveTask = Disposable & {
  readonly taskId: string
  readonly state: ObservableValue<TaskSubscriptionState>
}

/**
 * Discriminated state of a {@link LiveTask}. `subscribed` carries the
 * folded task row; `error` carries the server/transport failure reason.
 */
export type TaskSubscriptionState =
  | { status: 'connecting' }
  | { status: 'subscribed'; task: Task }
  | { status: 'error'; error: string }

export type { BlobUploadUrl }
