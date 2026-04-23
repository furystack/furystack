import { defineService, type Token } from '@furystack/inject'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Data, WebSocket } from 'ws'

/**
 * Union of every server-lifecycle event the rest-service runtime emits. Replaces
 * the `EventHub`s that used to live on the deleted `ServerManager`,
 * `ProxyManager` and `WebSocketApi` classes — consumers subscribe once to the
 * telemetry singleton and receive events from every source.
 */
export type ServerTelemetryEvents = {
  /** Emitted when the pool successfully opens an HTTP listener. */
  onServerListening: { url: string; port: number; hostName?: string }
  /** Emitted when the pool closes an HTTP listener during disposal. */
  onServerClosed: { url: string }
  /** Emitted when an API's `onRequest` rejects. Tuple matches the original `ServerManager` payload. */
  onRequestFailed: [unknown, IncomingMessage, ServerResponse<IncomingMessage>]
  /** Emitted when an HTTP proxy round-trip fails. */
  onProxyFailed: { from: string; to: string; error: unknown }
  /** Emitted when a WebSocket proxy upgrade fails. */
  onWebSocketProxyFailed: { from: string; to: string; error: unknown }
  /** Emitted when a WebSocket API action fails during lookup or execution. */
  onWebSocketActionFailed: { error: unknown; data?: Data; socket?: WebSocket }
  /** Emitted when a listener registered on this telemetry hub throws. */
  onListenerError: ListenerErrorPayload
}

/**
 * Telemetry surface exposed to applications. Extending {@link EventHub}
 * gives subscribers the same `addListener` / `subscribe` / `emit` API they
 * were using on the pre-migration managers.
 */
export class ServerTelemetry extends EventHub<ServerTelemetryEvents> {}

/**
 * DI token for the shared {@link ServerTelemetry} instance. Scoped so each
 * injector tree (in particular, each test) gets an isolated event stream.
 */
export const ServerTelemetryToken: Token<ServerTelemetry, 'scoped'> = defineService({
  name: 'furystack/rest-service/ServerTelemetry',
  lifetime: 'scoped',
  factory: ({ onDispose }) => {
    const telemetry = new ServerTelemetry()
    // Disposal is delegated to the injector via `onDispose`; the telemetry
    // outlives this factory invocation and is torn down on scope teardown.
    // eslint-disable-next-line furystack/prefer-using-wrapper
    onDispose(() => telemetry[Symbol.dispose]())
    return telemetry
  },
})
