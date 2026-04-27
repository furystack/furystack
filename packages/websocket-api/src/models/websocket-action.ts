import type { Injector } from '@furystack/inject'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'

/**
 * Context passed to a {@link WebSocketAction}'s `canExecute` hook. Kept
 * intentionally minimal — the match step runs against every incoming
 * message, so it must stay side-effect free and cheap.
 */
export interface WebSocketActionMatchContext {
  data: Data
  request: IncomingMessage
  socket: WebSocket
}

/**
 * Context passed to a {@link WebSocketAction}'s `execute` implementation.
 * `injector` is the per-connection scope created by `useWebSocketApi` and
 * carries a bound `IdentityContext` for the requesting client.
 */
export interface WebSocketActionContext extends WebSocketActionMatchContext {
  injector: Injector
}

/**
 * A WebSocket action descriptor. Plain objects replace the former
 * class-based contract: no decorators, no static members, no per-request
 * instances — deps are resolved from `context.injector` on demand.
 */
export interface WebSocketAction {
  canExecute: (context: WebSocketActionMatchContext) => boolean
  /** Errors thrown here are forwarded to `ServerTelemetryToken#onWebSocketActionFailed`. */
  execute: (context: WebSocketActionContext) => Promise<void>
}
