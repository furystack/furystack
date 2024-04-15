import { Injector, Injectable } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { WebSocketApi } from './websocket-api.js'
import { WebSocket } from 'ws'
import type { WebSocketAction } from './models/websocket-action.js'
import { useWebsockets } from './helpers.js'
import { describe, it, expect } from 'vitest'
import { getPort } from '@furystack/core/port-generator'
import { InMemoryStore, User, addStore } from '@furystack/core'
import { DefaultSession } from '@furystack/rest-service'

describe('WebSocketApi', () => {
  it('Should be built', async () => {
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
        new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
      )
      useWebsockets(i, { port: getPort() })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
        new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
      )

      useWebsockets(i, { path: '/web-socket', port: getPort() })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })

  it('Should broadcast messages', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
        new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
      )

      expect.assertions(5) // All 5 clients should receive the message
      useWebsockets(i, { path: '/web-socket', port })
      const api = i.getInstance(WebSocketApi)
      await Promise.all(
        [1, 2, 3, 4, 5].map(async () => {
          const client = new WebSocket(`ws://localhost:${port}/web-socket`)
          await new Promise<void>((resolve) =>
            client.once('open', () => {
              resolve()
            }),
          )
          client.once('message', (data) => {
            expect(data.toString()).toBe('alma')
          })
          await api.broadcast(({ ws }) => {
            ws.send('alma')
          })
          client.close()
          await new Promise<void>((resolve) => client.once('close', () => resolve()))
        }),
      )
    })
  })

  it('Should receive client messages', async () => {
    const port = getPort()
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
        new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
      )

      expect.assertions(1)
      const data = { value: 'alma' }
      @Injectable()
      class ExampleWsAction implements WebSocketAction {
        public dispose() {
          /** */
        }
        public static canExecute() {
          return true
        }

        public async execute(incomingData: any) {
          expect(JSON.parse(incomingData.data.toString())).toEqual(data)
        }
      }

      useWebsockets(i, { path: '/web-socket', port, actions: [ExampleWsAction] })
      const client = new WebSocket(`ws://localhost:${port}/web-socket`)
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      await new Promise<void>((resolve, reject) =>
        client.send(JSON.stringify(data), (err) => (err ? reject(err) : resolve())),
      )
      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
    })
  })
})
