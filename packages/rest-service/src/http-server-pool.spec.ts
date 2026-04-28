import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { HttpServerPoolToken, type OnRequest, type OnUpgrade, type ServerApi } from './http-server-pool.js'
import { ServerTelemetryToken } from './server-telemetry.js'

/** Returns a `ServerApi` that executes `handler` on every matching request. */
const makeApi = (handler: (options: OnRequest) => Promise<void>): ServerApi => ({
  shouldExec: () => true,
  onRequest: handler,
})

describe('HttpServerPool', () => {
  it('Should return the cached record on subsequent acquire calls for the same url', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const pool = injector.get(HttpServerPoolToken)
      const port = getPort()
      const first = await pool.acquire({ port })
      const second = await pool.acquire({ port })
      expect(second).toBe(first)
    })
  })

  it('Should de-duplicate concurrent acquire calls into a single server creation', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const pool = injector.get(HttpServerPoolToken)
      const port = getPort()
      const [a, b, c] = await Promise.all([pool.acquire({ port }), pool.acquire({ port }), pool.acquire({ port })])
      expect(b).toBe(a)
      expect(c).toBe(a)
    })
  })

  it('Should emit onServerListening when a new record is opened', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const telemetry = injector.get(ServerTelemetryToken)
      const listening = vi.fn()
      telemetry.subscribe('onServerListening', listening)

      const port = getPort()
      await injector.get(HttpServerPoolToken).acquire({ port })
      expect(listening).toHaveBeenCalledWith({ url: `http://localhost:${port}`, port, hostName: undefined })
    })
  })

  it('Should destroy the socket and route the rejection through telemetry when onUpgrade rejects', async () => {
    const injector = createInjector()
    try {
      const pool = injector.get(HttpServerPoolToken)
      const telemetry = injector.get(ServerTelemetryToken)
      const onRequestFailed = vi.fn()
      telemetry.subscribe('onRequestFailed', onRequestFailed)

      const port = getPort()
      const record = await pool.acquire({ port })

      const rejection = new Error('upgrade boom')
      const onUpgrade = vi.fn<(options: OnUpgrade) => Promise<void>>().mockRejectedValue(rejection)
      record.apis.push({
        shouldExec: () => true,
        onRequest: () => Promise.resolve(),
        onUpgrade,
      })

      const socketClosed = new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`)
        ws.on('close', () => resolve())
        ws.on('error', () => resolve())
      })
      await socketClosed
      await new Promise((r) => setTimeout(r, 20))

      expect(onUpgrade).toHaveBeenCalledTimes(1)
      expect(onRequestFailed).toHaveBeenCalledTimes(1)
      const [error] = onRequestFailed.mock.calls[0][0] as [unknown, IncomingMessage, ServerResponse]
      expect(error).toBe(rejection)
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('Should destroy the socket when no API claims the upgrade', async () => {
    const injector = createInjector()
    try {
      const pool = injector.get(HttpServerPoolToken)
      const port = getPort()
      await pool.acquire({ port })

      const ws = new WebSocket(`ws://127.0.0.1:${port}`)
      await new Promise<void>((resolve) => {
        ws.on('close', () => resolve())
        ws.on('error', () => resolve())
      })
      expect(ws.readyState).toBe(WebSocket.CLOSED)
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('Should destroy the raw socket when no API matches a normal request', async () => {
    const injector = createInjector()
    try {
      const pool = injector.get(HttpServerPoolToken)
      const port = getPort()
      await pool.acquire({ port })

      await expect(fetch(`http://127.0.0.1:${port}/nothing`)).rejects.toBeDefined()
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('Should surface onRequest rejections through telemetry without crashing the server', async () => {
    const injector = createInjector()
    try {
      const pool = injector.get(HttpServerPoolToken)
      const telemetry = injector.get(ServerTelemetryToken)
      const onRequestFailed = vi.fn()
      telemetry.subscribe('onRequestFailed', onRequestFailed)

      const port = getPort()
      const record = await pool.acquire({ port })
      const rejection = new Error('request boom')
      record.apis.push(
        makeApi(async ({ res }) => {
          res.end()
          throw rejection
        }),
      )

      await fetch(`http://127.0.0.1:${port}/test`)
      await new Promise((r) => setTimeout(r, 20))

      expect(onRequestFailed).toHaveBeenCalledTimes(1)
      const [error] = onRequestFailed.mock.calls[0][0] as [unknown, IncomingMessage, ServerResponse]
      expect(error).toBe(rejection)
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('Should destroy open client sockets during disposal', async () => {
    const injector = createInjector()
    const pool = injector.get(HttpServerPoolToken)
    const port = getPort()
    const record = await pool.acquire({ port })

    record.apis.push({
      shouldExec: () => true,
      onRequest: async ({ res }) => {
        res.writeHead(200)
        res.write('streaming')
      },
    })

    // Keep a client socket open so the dispose path has something to destroy.
    const inflight = fetch(`http://127.0.0.1:${port}/slow`).catch(() => undefined)
    await new Promise((r) => setTimeout(r, 50))

    await injector[Symbol.asyncDispose]()
    await inflight
  })

  it('Should absorb server.close errors during dispose without crashing', async () => {
    const injector = createInjector()
    const pool = injector.get(HttpServerPoolToken)
    const port = getPort()
    const record = await pool.acquire({ port })

    // Force `server.close` to invoke its callback with an error -- the pool
    // wraps every close in `Promise.allSettled`, so the rejected branch
    // (`if (err) { reject(err); return }`) is exercised but the injector's
    // dispose still resolves cleanly.
    const closeError = new Error('close boom')
    const closeSpy = vi.fn((cb?: (err?: Error) => void) => {
      cb?.(closeError)
      return record.server
    })
    record.server.close = closeSpy
    ;(record.server as unknown as { off: (...args: unknown[]) => void }).off = () => undefined

    await expect(injector[Symbol.asyncDispose]()).resolves.toBeUndefined()
    expect(closeSpy).toHaveBeenCalled()
  })

  it('Should drain in-flight acquire promises during dispose', async () => {
    const injector = createInjector()
    const port = getPort()
    const pool = injector.get(HttpServerPoolToken)
    const inflight = pool.acquire({ port })
    await injector[Symbol.asyncDispose]()
    // The in-flight promise either resolved (server opened before dispose)
    // or rejected cleanly — both are acceptable; we just assert no process
    // crash / unhandled rejection escaped the pool's `allSettled` guard.
    await inflight.catch(() => undefined)
  })

  it('Should stop tracking sockets that close before dispose', async () => {
    const injector = createInjector()
    try {
      const pool = injector.get(HttpServerPoolToken)
      const port = getPort()
      const record = await pool.acquire({ port })
      record.apis.push(
        makeApi(async ({ res }) => {
          res.end('ok')
        }),
      )

      await fetch(`http://127.0.0.1:${port}/ok`)
      // Let the TCP socket actually flip to 'close' before we tear down.
      await new Promise((r) => setTimeout(r, 50))
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })
})
