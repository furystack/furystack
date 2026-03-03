import { InMemoryStore, User, addStore } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injectable, Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { DefaultSession } from '@furystack/rest-service'
import { PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket, type Data } from 'ws'
import { useWebsockets } from './helpers.js'
import type { WebSocketAction } from './models/websocket-action.js'
import { WebSocketApi } from './websocket-api.js'

const setupStoresAndDataSets = (injector: Injector) => {
  addStore(injector, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  const repo = getRepository(injector)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(PasswordResetToken, 'token')

  usePasswordPolicy(injector)
}

describe('WebSocketApi', () => {
  it('Should be built', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)
      await useWebsockets(i, { port: getPort() })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)
      await useWebsockets(i, { path: '/web-socket', port: getPort() })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })

  it('Should broadcast messages', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)

      await useWebsockets(i, { path: '/web-socket', port })
      const api = i.getInstance(WebSocketApi)

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

      await api.broadcast(({ ws }) => {
        ws.send('alma')
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

  it('Should emit onClientConnected and onClientDisconnected events', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)
      await useWebsockets(i, { path: '/ws-events', port })
      const api = i.getInstance(WebSocketApi)

      const connectedHandler = vi.fn()
      const disconnectedHandler = vi.fn()
      api.addListener('onClientConnected', connectedHandler)
      api.addListener('onClientDisconnected', disconnectedHandler)

      const client = new WebSocket(`ws://localhost:${port}/ws-events`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      expect(connectedHandler).toHaveBeenCalled()
      expect(connectedHandler).toHaveBeenCalledWith(
        expect.objectContaining({ ws: expect.any(Object) as object, message: expect.any(Object) as object }),
      )

      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(disconnectedHandler).toHaveBeenCalled()
    })
  })

  it('Should emit onError when action execution throws', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)

      @Injectable()
      class FailingAction implements WebSocketAction {
        public [Symbol.dispose]() {
          /** */
        }
        public static canExecute() {
          return true
        }
        public async execute(): Promise<void> {
          throw new Error('action failed')
        }
      }

      await useWebsockets(i, { path: '/ws-error-test', port, actions: [FailingAction] })
      const api = i.getInstance(WebSocketApi)

      const errorHandler = vi.fn()
      api.addListener('onError', errorHandler)

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

  it('Should receive client messages', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      setupStoresAndDataSets(i)

      const data = { value: 'test-message-unique' }
      @Injectable()
      class ExampleWsAction implements WebSocketAction {
        public [Symbol.dispose]() {
          /** */
        }
        public static canExecute(incomingData: { data: Data }) {
          try {
            const parsed = JSON.parse((incomingData.data as Buffer).toString()) as unknown
            return (
              typeof parsed === 'object' &&
              parsed !== null &&
              'value' in parsed &&
              parsed.value === 'test-message-unique'
            )
          } catch {
            return false
          }
        }

        public async execute(options: { data: Data; socket: WebSocket }) {
          expect(JSON.parse((options.data as Buffer).toString())).toEqual(data)
          options.socket.send('done')
        }
      }

      await useWebsockets(i, { path: '/web-socket-test', port, actions: [ExampleWsAction] })
      const client = new WebSocket(`ws://localhost:${port}/web-socket-test`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      const responsePromise = new Promise<void>((resolve) => {
        client.once('message', () => {
          resolve()
        })
      })

      await new Promise<void>((resolve, reject) =>
        client.send(JSON.stringify(data), (err) => (err ? reject(err) : resolve())),
      )

      await responsePromise
      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
    })
  })
})
