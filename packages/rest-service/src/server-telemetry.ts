import { defineService, type Token } from '@furystack/inject'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Data, WebSocket } from 'ws'

/**
 * Union of every server-lifecycle event the rest-service runtime emits.
 * The HTTP server pool, proxy runtime and websocket-api all forward into
 * this single hub so subscribers can observe every source from one place.
 */
export type ServerTelemetryEvents = {
  onServerListening: { url: string; port: number; hostName?: string }
  onServerClosed: { url: string }
  /** Tuple-shaped to match the underlying Node `request` callback signature. */
  onRequestFailed: [unknown, IncomingMessage, ServerResponse<IncomingMessage>]
  onProxyFailed: { from: string; to: string; error: unknown }
  onWebSocketProxyFailed: { from: string; to: string; error: unknown }
  onWebSocketActionFailed: { error: unknown; data?: Data; socket?: WebSocket }
  onListenerError: ListenerErrorPayload
}

/**
 * Application-facing telemetry surface. Extends {@link EventHub} so
 * subscribers use the standard `addListener` / `subscribe` API.
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
