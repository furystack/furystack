import type { SubmitDraftRequest, SubmitDraftResponse } from '@furystack/task-runner/endpoints'
import type { Task, TaskTreeNode } from '@furystack/task-runner'
import { TaskRunnerClientError } from './task-runner-client-error.js'
import { TaskSocket } from './task-socket.js'
import { uploadBlob, type FetchLike } from './upload-blob.js'
import type { BlobBody, BlobUploadUrl, LiveTask, SubmitTaskOptions } from './types.js'

/**
 * Options for {@link TaskRunnerClient}.
 */
export type TaskRunnerClientOptions = {
  /**
   * Base URL of the REST root the server mounts (the `rootPath` passed to
   * `useTaskRunnerEndpoints`), e.g. `'http://localhost:3000/tasks'`.
   * Trailing slashes are trimmed.
   */
  rootUrl: string
  /**
   * WebSocket URL of the `/tasks-socket` endpoint. Required only when
   * {@link TaskRunnerClient.subscribeProgress} is used.
   */
  wsUrl?: string
  /** Fetch implementation. Defaults to the global `fetch`. */
  fetchImpl?: FetchLike
  /** WebSocket factory forwarded to the underlying transport. */
  createWebSocket?: (url: string) => WebSocket
  /** Auto-reconnect the WS transport. Default: true. */
  reconnect?: boolean
  /** Base backoff delay (ms) for WS reconnect. Default: 1000. */
  reconnectBaseMs?: number
  /** Max backoff delay (ms) for WS reconnect. Default: 30000. */
  reconnectMaxMs?: number
  /** Max WS reconnect attempts. Default: Infinity. */
  maxReconnectAttempts?: number
}

const stripTrailingSlash = (s: string): string => (s.endsWith('/') ? s.slice(0, -1) : s)

/**
 * Browser-side SDK consuming the task-runner REST + WS surface (PRD M4).
 * Wraps the two-phase submit flow (draft → upload → start), task queries,
 * cancellation, blob upload, and live progress subscriptions.
 *
 * @example
 * ```ts
 * using client = new TaskRunnerClient({
 *   rootUrl: 'http://localhost:3000/tasks',
 *   wsUrl: 'ws://localhost:3000/tasks-socket',
 * })
 * const task = await client.submitTask({ type: 'echo', payload: { value: 'hi' }, handlerVersion: 1 })
 * using live = client.subscribeProgress(task.id)
 * live.state.subscribe((s) => console.log(s))
 * ```
 */
export class TaskRunnerClient implements Disposable {
  private readonly rootUrl: string
  private readonly fetchImpl: FetchLike
  private socket?: TaskSocket

  constructor(private readonly options: TaskRunnerClientOptions) {
    this.rootUrl = stripTrailingSlash(options.rootUrl)
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch
  }

  private async parseError(response: Response): Promise<never> {
    let code = 'io-error'
    let message = `Request failed with status ${response.status}`
    try {
      const { code: bodyCode, message: bodyMessage } = (await response.json()) as { code?: string; message?: string }
      if (typeof bodyCode === 'string') code = bodyCode
      if (typeof bodyMessage === 'string') message = bodyMessage
    } catch {
      // Non-JSON error body; keep the status-derived defaults.
    }
    throw new TaskRunnerClientError({ code, message, status: response.status })
  }

  /**
   * Creates a draft task (`POST {rootUrl}`). When `uploads` is supplied the
   * response carries a presigned ticket per slot. The draft is **not**
   * dispatched until {@link TaskRunnerClient.startTask}.
   */
  public async draftTask<TPayload = unknown>(
    args: Omit<SubmitDraftRequest, 'payload' | 'notBefore'> & { payload: TPayload; notBefore?: Date | string },
  ): Promise<SubmitDraftResponse> {
    const body: SubmitDraftRequest = {
      ...args,
      notBefore: args.notBefore instanceof Date ? args.notBefore.toISOString() : args.notBefore,
    }
    const response = await this.fetchImpl(this.rootUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) return this.parseError(response)
    return (await response.json()) as SubmitDraftResponse
  }

  /**
   * Releases a draft to the queue (`POST {rootUrl}/:id/start`), optionally
   * replacing the payload. Returns the updated task.
   */
  public async startTask<TPayload = unknown>(taskId: string, payload?: TPayload): Promise<Task> {
    const response = await this.fetchImpl(`${this.rootUrl}/${encodeURIComponent(taskId)}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload === undefined ? {} : { payload }),
    })
    if (!response.ok) return this.parseError(response)
    return (await response.json()) as Task
  }

  /**
   * Submits a task end-to-end: drafts it, uploads each blob slot to its
   * presigned ticket, resolves the final payload via `resolvePayload`, then
   * starts the task. With no `uploads` it reduces to draft + start.
   */
  public async submitTask<TPayload = unknown>(options: SubmitTaskOptions<TPayload>): Promise<Task> {
    const { uploads, resolvePayload, payload, ...rest } = options
    const uploadSpec = uploads
      ? Object.fromEntries(
          Object.entries(uploads).map(([name, slot]) => [
            name,
            { contentType: slot.contentType, maxBytes: slot.maxBytes, ttlSec: slot.ttlSec },
          ]),
        )
      : undefined

    const draft = await this.draftTask<TPayload>({ ...rest, payload, uploads: uploadSpec })

    const uploadedKeys: Record<string, string> = {}
    if (uploads) {
      for (const [name, slot] of Object.entries(uploads)) {
        const ticket = draft.uploads[name]
        await uploadBlob(ticket, slot.body, { contentType: slot.contentType, fetchImpl: this.fetchImpl })
        uploadedKeys[name] = ticket.key
      }
    }

    const finalPayload = resolvePayload ? resolvePayload({ payload, uploadedKeys }) : payload
    return this.startTask<TPayload>(draft.task.id, finalPayload)
  }

  /** Cancels a task (`DELETE {rootUrl}/:id`). Cascades to descendants server-side. */
  public async cancelTask(taskId: string, reason?: string): Promise<void> {
    const url = reason
      ? `${this.rootUrl}/${encodeURIComponent(taskId)}?reason=${encodeURIComponent(reason)}`
      : `${this.rootUrl}/${encodeURIComponent(taskId)}`
    const response = await this.fetchImpl(url, { method: 'DELETE' })
    if (!response.ok) return this.parseError(response)
  }

  /** Fetches a task row (`GET {rootUrl}/:id`). Returns `undefined` when not found. */
  public async getTask(taskId: string): Promise<Task | undefined> {
    const response = await this.fetchImpl(`${this.rootUrl}/${encodeURIComponent(taskId)}`)
    if (response.status === 404) return undefined
    if (!response.ok) return this.parseError(response)
    return (await response.json()) as Task
  }

  /** Fetches the task tree (`GET {rootUrl}/:id/tree`). */
  public async getTaskTree(taskId: string): Promise<TaskTreeNode> {
    const response = await this.fetchImpl(`${this.rootUrl}/${encodeURIComponent(taskId)}/tree`)
    if (!response.ok) return this.parseError(response)
    return (await response.json()) as TaskTreeNode
  }

  /**
   * Uploads `body` to a presigned ticket using this client's fetch
   * implementation. See {@link uploadBlob} for the path handling.
   */
  public async uploadBlob(ticket: BlobUploadUrl, body: BlobBody, contentType?: string): Promise<void> {
    return uploadBlob(ticket, body, { contentType, fetchImpl: this.fetchImpl })
  }

  /**
   * Opens a live subscription for `taskId` over the WS transport. Requires
   * `wsUrl` in the constructor options. The transport is created lazily on
   * first call and shared across subscriptions.
   */
  public subscribeProgress(taskId: string): LiveTask {
    if (!this.options.wsUrl) {
      throw new TaskRunnerClientError({
        code: 'invalid-config',
        message: 'subscribeProgress requires `wsUrl` in TaskRunnerClientOptions',
        status: 0,
      })
    }
    this.socket ??= new TaskSocket({
      wsUrl: this.options.wsUrl,
      createWebSocket: this.options.createWebSocket,
      reconnect: this.options.reconnect,
      reconnectBaseMs: this.options.reconnectBaseMs,
      reconnectMaxMs: this.options.reconnectMaxMs,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
    })
    return this.socket.subscribe(taskId)
  }

  public [Symbol.dispose](): void {
    this.socket?.[Symbol.dispose]()
    this.socket = undefined
  }
}
