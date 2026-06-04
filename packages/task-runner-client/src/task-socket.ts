import { ObservableValue } from '@furystack/utils'
import type { ClientTaskMessage, ServerTaskMessage } from '@furystack/task-runner/endpoints'
import type { Task, TaskUpdate } from '@furystack/task-runner'
import type { LiveTask, TaskSubscriptionState } from './types.js'

/** Options for the internal {@link TaskSocket}. */
export type TaskSocketOptions = {
  /** WebSocket URL of the `/tasks-socket` endpoint. */
  wsUrl: string
  /** Factory for WebSocket instances. Defaults to the global `WebSocket`. */
  createWebSocket?: (url: string) => WebSocket
  /** Auto-reconnect on close/error. Default: true. */
  reconnect?: boolean
  /** Base backoff delay (ms). Default: 1000. */
  reconnectBaseMs?: number
  /** Max backoff delay (ms). Default: 30000. */
  reconnectMaxMs?: number
  /** Max reconnect attempts before giving up. Default: Infinity. */
  maxReconnectAttempts?: number
}

type TaskSubInternal = {
  taskId: string
  requestId: string
  subscriptionId?: string
  state: ObservableValue<TaskSubscriptionState>
  disposed: boolean
}

const WS_OPEN = 1

const foldUpdate = (task: Task, update: TaskUpdate): Task => {
  switch (update.kind) {
    case 'status':
      return { ...task, status: update.status }
    case 'progress':
      return { ...task, progress: { percent: update.percent, meta: update.meta, updatedAt: update.at } }
    case 'spawned-child':
      return task.childTaskIds.includes(update.childTaskId)
        ? task
        : { ...task, childTaskIds: [...task.childTaskIds, update.childTaskId] }
    case 'child-completed':
      return task
    default:
      return task
  }
}

/**
 * Manages a single WebSocket connection to the `/tasks-socket` endpoint
 * and multiplexes per-task subscriptions over it. Mirrors the reconnect /
 * backoff / pending-message plumbing of `@furystack/entity-sync-client`'s
 * transport but speaks the task `subscribe-task` envelope (PRD §7.7).
 *
 * Active (non-disposed) subscriptions are re-issued with fresh request ids
 * after a reconnect so a dropped socket transparently recovers.
 */
export class TaskSocket implements Disposable {
  private ws: WebSocket | null = null
  private readonly subs = new Set<TaskSubInternal>()
  private readonly pendingByRequestId = new Map<string, TaskSubInternal>()
  private readonly bySubscriptionId = new Map<string, TaskSubInternal>()
  private readonly pendingMessages: string[] = []
  private requestCounter = 0
  private reconnectAttempt = 0
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private disposed = false

  constructor(private readonly options: TaskSocketOptions) {
    this.connect()
  }

  private connect(): void {
    if (this.disposed) return
    const createWs = this.options.createWebSocket ?? ((url: string) => new WebSocket(url))
    this.ws = createWs(this.options.wsUrl)

    this.ws.onopen = () => {
      if (this.disposed) return
      this.reconnectAttempt = 0
      this.resubscribeActive()
      this.flushPendingMessages()
    }
    this.ws.onmessage = (event: MessageEvent) => {
      if (this.disposed) return
      try {
        const message = JSON.parse(String(event.data)) as ServerTaskMessage
        this.handleMessage(message)
      } catch {
        // Ignore malformed frames; the server only emits valid JSON.
      }
    }
    this.ws.onerror = () => this.handleConnectionLoss()
    this.ws.onclose = () => {
      this.handleConnectionLoss()
      this.scheduleReconnect()
    }
  }

  private flushPendingMessages(): void {
    if (!this.ws) return
    for (const msg of this.pendingMessages) this.ws.send(msg)
    this.pendingMessages.length = 0
  }

  private send(message: ClientTaskMessage): void {
    const data = JSON.stringify(message)
    if (this.ws && this.ws.readyState === WS_OPEN) {
      this.ws.send(data)
    } else {
      this.pendingMessages.push(data)
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return
    if (!(this.options.reconnect ?? true)) return
    const maxAttempts = this.options.maxReconnectAttempts ?? Infinity
    if (this.reconnectAttempt >= maxAttempts) return
    const baseMs = this.options.reconnectBaseMs ?? 1000
    const maxMs = this.options.reconnectMaxMs ?? 30000
    const delay = Math.min(baseMs * Math.pow(2, this.reconnectAttempt), maxMs)
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, delay)
  }

  private resubscribeActive(): void {
    for (const internal of this.subs) {
      if (internal.disposed) continue
      this.pendingByRequestId.delete(internal.requestId)
      if (internal.subscriptionId) this.bySubscriptionId.delete(internal.subscriptionId)
      internal.subscriptionId = undefined
      internal.requestId = `task-req-${++this.requestCounter}`
      this.pendingByRequestId.set(internal.requestId, internal)
      this.send({ type: 'subscribe-task', requestId: internal.requestId, taskId: internal.taskId })
    }
  }

  private handleConnectionLoss(): void {
    for (const internal of this.subs) {
      if (internal.subscriptionId) this.bySubscriptionId.delete(internal.subscriptionId)
      internal.subscriptionId = undefined
    }
  }

  private handleMessage(message: ServerTaskMessage): void {
    if (message.type === 'subscribed-task') {
      const internal = this.pendingByRequestId.get(message.requestId)
      if (!internal) return
      this.pendingByRequestId.delete(message.requestId)
      internal.subscriptionId = message.subscriptionId
      this.bySubscriptionId.set(message.subscriptionId, internal)
      if (!internal.state.isDisposed) internal.state.setValue({ status: 'subscribed', task: message.task })
      return
    }
    if (message.type === 'subscription-error') {
      const internal = this.pendingByRequestId.get(message.requestId)
      if (!internal) return
      this.pendingByRequestId.delete(message.requestId)
      if (!internal.state.isDisposed) internal.state.setValue({ status: 'error', error: message.error })
      return
    }
    const internal = this.bySubscriptionId.get(message.subscriptionId)
    if (!internal || internal.state.isDisposed) return
    const current = internal.state.getValue()
    if (current.status !== 'subscribed') return
    const { type: _type, subscriptionId: _subscriptionId, ...update } = message
    internal.state.setValue({ status: 'subscribed', task: foldUpdate(current.task, update) })
  }

  /**
   * Opens a subscription for `taskId`. The returned {@link LiveTask}'s
   * `state` starts as `connecting`, transitions to `subscribed` (carrying
   * the folded task row) on the server ack, and to `error` on failure.
   */
  public subscribe(taskId: string): LiveTask {
    const requestId = `task-req-${++this.requestCounter}`
    const internal: TaskSubInternal = {
      taskId,
      requestId,
      state: new ObservableValue<TaskSubscriptionState>({ status: 'connecting' }),
      disposed: false,
    }
    this.subs.add(internal)
    this.pendingByRequestId.set(requestId, internal)
    this.send({ type: 'subscribe-task', requestId, taskId })

    return {
      taskId,
      state: internal.state,
      [Symbol.dispose]: () => this.disposeSub(internal),
    }
  }

  private disposeSub(internal: TaskSubInternal): void {
    if (internal.disposed) return
    internal.disposed = true
    this.pendingByRequestId.delete(internal.requestId)
    if (internal.subscriptionId) {
      this.send({ type: 'unsubscribe-task', subscriptionId: internal.subscriptionId })
      this.bySubscriptionId.delete(internal.subscriptionId)
    }
    this.subs.delete(internal)
    if (!internal.state.isDisposed) internal.state[Symbol.dispose]()
  }

  public [Symbol.dispose](): void {
    this.disposed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    for (const internal of this.subs) {
      if (!internal.state.isDisposed) internal.state[Symbol.dispose]()
    }
    this.subs.clear()
    this.pendingByRequestId.clear()
    this.bySubscriptionId.clear()
    this.pendingMessages.length = 0
    this.ws?.close()
  }
}
