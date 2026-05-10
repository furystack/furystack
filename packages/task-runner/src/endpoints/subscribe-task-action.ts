import type { BusMessage, CrossNodeBus } from '@furystack/cross-node-bus'
import { CrossNodeBus as CrossNodeBusToken } from '@furystack/cross-node-bus'
import type { WebSocketAction, WebSocketActionContext, WebSocketActionMatchContext } from '@furystack/websocket-api'
import type WebSocket from 'ws'
import { TaskRunner as TaskRunnerToken } from '../task-runner.js'
import type { TaskRunner } from '../task-runner.js'
import type { Task, TaskUpdate } from '../types.js'
import { authorize, type AuthorizerSpec } from './route-authorizer.js'

/**
 * Wire-format messages exchanged with the WS endpoint. Mirrors the
 * `subscribe-entity` shape of `@furystack/entity-sync-service` so the
 * client SDK landing in M4 can reuse the same envelope conventions.
 */
export type ClientTaskMessage =
  | {
      type: 'subscribe-task'
      requestId: string
      taskId: string
    }
  | {
      type: 'unsubscribe-task'
      subscriptionId: string
    }

export type ServerTaskMessage =
  | {
      type: 'subscribed-task'
      requestId: string
      subscriptionId: string
      task: Task
    }
  | {
      type: 'subscription-error'
      requestId: string
      error: string
    }
  | ({
      type: 'task-update'
      subscriptionId: string
    } & TaskUpdate)

/**
 * Options accepted by {@link createSubscribeTaskAction}.
 */
export type SubscribeTaskActionOptions = {
  authorizers?: Record<string, AuthorizerSpec>
}

const isClientTaskMessage = (raw: unknown): raw is ClientTaskMessage => {
  if (!raw || typeof raw !== 'object') return false
  const t = (raw as { type?: unknown }).type
  return t === 'subscribe-task' || t === 'unsubscribe-task'
}

/**
 * Per-socket subscription state. Tracks the bus-topic disposables for
 * each active task subscription so unsubscribe can tear them down
 * synchronously and the WS close handler can sweep stragglers.
 */
type SocketSubscriptionState = {
  subscriptions: Map<string, { taskId: string; disposables: Disposable[] }>
}

const SOCKET_STATE = new WeakMap<WebSocket, SocketSubscriptionState>()

const getOrInitSocketState = (socket: WebSocket): SocketSubscriptionState => {
  let state = SOCKET_STATE.get(socket)
  if (state) return state
  state = { subscriptions: new Map() }
  SOCKET_STATE.set(socket, state)
  socket.on('close', () => {
    const final = SOCKET_STATE.get(socket)
    if (!final) return
    for (const sub of final.subscriptions.values()) {
      for (const d of sub.disposables) d[Symbol.dispose]()
    }
    final.subscriptions.clear()
    SOCKET_STATE.delete(socket)
  })
  return state
}

const send = (socket: WebSocket, message: ServerTaskMessage): void => {
  if (socket.readyState !== 1) return
  socket.send(JSON.stringify(message))
}

/**
 * Builds the WebSocket action that powers `WS {wsPath}` task subscriptions
 * (PRD §7.7). On `subscribe-task`:
 *
 * 1. Resolves the requesting identity and applies any per-type
 *    `subscribe` authorizer.
 * 2. Reads the task snapshot from the runner and replies with
 *    `subscribed-task` carrying the persisted row.
 * 3. Subscribes to `tasks/progress/${task.type}` and
 *    `tasks/status/${task.type}`, filters every message by `taskId`
 *    client-side, dedups against the latest seen `seq` via
 *    {@link CrossNodeBus.compareSeq}, and forwards matching updates as
 *    `task-update` messages.
 *
 * On `unsubscribe-task` the bus-topic subscriptions for the matching
 * `subscriptionId` are disposed synchronously. Per-socket state is held
 * in a `WeakMap` so a closing socket sweeps every outstanding
 * subscription automatically.
 */
export const createSubscribeTaskAction = (options?: SubscribeTaskActionOptions): WebSocketAction => {
  const authorizers = options?.authorizers ?? {}
  let subscriptionCounter = 0

  const handleSubscribe = async (
    ctx: WebSocketActionContext,
    message: Extract<ClientTaskMessage, { type: 'subscribe-task' }>,
  ): Promise<void> => {
    const runner = ctx.injector.get<TaskRunner>(TaskRunnerToken)
    const bus = ctx.injector.get<CrossNodeBus>(CrossNodeBusToken)

    const task = await runner.get(message.taskId)
    if (!task) {
      send(ctx.socket, {
        type: 'subscription-error',
        requestId: message.requestId,
        error: `Task ${message.taskId} not found`,
      })
      return
    }

    const auth = await authorize({
      injector: ctx.injector,
      req: ctx.request,
      type: task.type,
      action: 'subscribe',
      authorizers,
    })
    if (!auth.ok) {
      send(ctx.socket, {
        type: 'subscription-error',
        requestId: message.requestId,
        error: auth.message,
      })
      return
    }

    const subscriptionId = `task-sub-${++subscriptionCounter}`
    const state = getOrInitSocketState(ctx.socket)

    let lastSeenSeq: string | undefined
    const dispatch = (busMessage: BusMessage): void => {
      const payload = busMessage.payload as TaskUpdate | null
      if (!payload || (payload as { taskId?: string }).taskId !== message.taskId) return
      if (lastSeenSeq && busMessage.seq && bus.compareSeq(busMessage.seq, lastSeenSeq) <= 0) return
      if (busMessage.seq) lastSeenSeq = busMessage.seq
      send(ctx.socket, { type: 'task-update', subscriptionId, ...payload })
    }

    const disposables: Disposable[] = [
      bus.subscribe(`tasks/progress/${task.type}`, dispatch),
      bus.subscribe(`tasks/status/${task.type}`, dispatch),
    ]

    state.subscriptions.set(subscriptionId, { taskId: message.taskId, disposables })

    send(ctx.socket, {
      type: 'subscribed-task',
      requestId: message.requestId,
      subscriptionId,
      task,
    })
  }

  const handleUnsubscribe = (
    ctx: WebSocketActionContext,
    message: Extract<ClientTaskMessage, { type: 'unsubscribe-task' }>,
  ): void => {
    const state = SOCKET_STATE.get(ctx.socket)
    const sub = state?.subscriptions.get(message.subscriptionId)
    if (!sub || !state) return
    for (const d of sub.disposables) d[Symbol.dispose]()
    state.subscriptions.delete(message.subscriptionId)
  }

  return {
    canExecute: ({ data }: WebSocketActionMatchContext): boolean => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const parsed = JSON.parse(data.toString()) as unknown
        return isClientTaskMessage(parsed)
      } catch {
        return false
      }
    },
    execute: async (ctx: WebSocketActionContext): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const parsed = JSON.parse(ctx.data.toString()) as ClientTaskMessage
      if (parsed.type === 'subscribe-task') {
        await handleSubscribe(ctx, parsed)
      } else {
        handleUnsubscribe(ctx, parsed)
      }
    },
  }
}
