import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import { ServerTelemetryToken } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import type { WebSocketAction } from './models/websocket-action.js'
import { useWebSocketApi } from './websocket-api.js'

describe('useWebSocketApi', () => {
  it('returns a handle exposing the underlying WebSocketServer', async () => {
    await usingAsync(createInjector(), async (i) => {
      const api = await useWebSocketApi({ injector: i, port: getPort() })
      expect(api.socket).toBeDefined()
      expect(typeof api.broadcast).toBe('function')
      expect(api.serverApi.shouldExec).toBeTypeOf('function')
    })
  })

  it('matches the configured path on the serverApi', async () => {
    await usingAsync(createInjector(), async (i) => {
      const api = await useWebSocketApi({ injector: i, port: getPort(), path: '/web-socket' })
      const req = { url: '/web-socket', headers: { host: 'localhost' } } as unknown as IncomingMessage
      const noMatch = { url: '/other', headers: { host: 'localhost' } } as unknown as IncomingMessage
      const res = {} as ServerResponse
      expect(api.serverApi.shouldExec({ req, res })).toBe(true)
      expect(api.serverApi.shouldExec({ req: noMatch, res })).toBe(false)
    })
  })

  it('broadcasts messages to every connected client', async () => {
    const port = getPort()
    await usingAsync(createInjector(), async (i) => {
      const api = await useWebSocketApi({ injector: i, port, path: '/web-socket' })

      const clients = await Promise.all(
        [1, 2, 3, 4, 5].map(async () => {
          const client = new WebSocket(`ws://localhost:${port}/web-socket`)
          await new Promise<void>((resolve) => client.once('open', () => resolve()))
          return client
        }),
      )

      const messagePromises = clients.map(
        (client) =>
          new Promise<string>((resolve) => {
            client.once('message', (data) => resolve((data as Buffer).toString()))
          }),
      )

      await api.broadcast(({ ws: socket }) => {
        socket.send('alma')
      })

      const messages = await Promise.all(messagePromises)
      for (const msg of messages) {
        expect(msg).toBe('alma')
      }

      await Promise.all(
        clients.map(async (client) => {
          client.close()
          await new Promise<void>((resolve) => client.once('close', () => resolve()))
        }),
      )
    })
  })

  it('emits onClientConnected and onClientDisconnected', async () => {
    const port = getPort()
    await usingAsync(createInjector(), async (i) => {
      const api = await useWebSocketApi({ injector: i, port, path: '/ws-events' })

      const connected = vi.fn()
      const disconnected = vi.fn()
      api.addListener('onClientConnected', connected)
      api.addListener('onClientDisconnected', disconnected)

      const client = new WebSocket(`ws://localhost:${port}/ws-events`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      expect(connected).toHaveBeenCalled()
      expect(connected).toHaveBeenCalledWith(
        expect.objectContaining({ ws: expect.any(Object) as object, message: expect.any(Object) as object }),
      )

      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(disconnected).toHaveBeenCalled()
    })
  })

  it('forwards action execution errors to ServerTelemetry#onWebSocketActionFailed', async () => {
    const port = getPort()
    await usingAsync(createInjector(), async (i) => {
      const failingAction: WebSocketAction = {
        canExecute: () => true,
        execute: async () => {
          throw new Error('action failed')
        },
      }
      await useWebSocketApi({ injector: i, port, path: '/ws-error-test', actions: [failingAction] })

      const telemetry = i.get(ServerTelemetryToken)
      const errorHandler = vi.fn()
      telemetry.addListener('onWebSocketActionFailed', errorHandler)

      const client = new WebSocket(`ws://localhost:${port}/ws-error-test`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))
      await new Promise<void>((resolve, reject) => client.send('trigger', (err) => (err ? reject(err) : resolve())))
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(errorHandler).toHaveBeenCalled()
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(Error) as Error }))

      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
    })
  })

  it('invokes the matched action with a per-connection injector', async () => {
    const port = getPort()
    await usingAsync(createInjector(), async (i) => {
      const executed = vi.fn()
      const action: WebSocketAction = {
        canExecute: ({ data }) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const parsed = JSON.parse(data.toString()) as unknown
            return (
              typeof parsed === 'object' &&
              parsed !== null &&
              'value' in parsed &&
              parsed.value === 'test-message-unique'
            )
          } catch {
            return false
          }
        },
        execute: async ({ socket, injector }) => {
          executed(injector !== i)
          socket.send('done')
        },
      }

      await useWebSocketApi({ injector: i, port, path: '/web-socket-test', actions: [action] })
      const client = new WebSocket(`ws://localhost:${port}/web-socket-test`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      const reply = new Promise<void>((resolve) => client.once('message', () => resolve()))
      await new Promise<void>((resolve, reject) =>
        client.send(JSON.stringify({ value: 'test-message-unique' }), (err) => (err ? reject(err) : resolve())),
      )
      await reply

      expect(executed).toHaveBeenCalledWith(true)

      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
    })
  })
})
