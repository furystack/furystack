import { Injector, Injectable } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { WebSocketApi } from './websocket-api.js'
import WebSocket from 'ws'
import type { WebSocketAction } from './models/websocket-action.js'
import { useWebsockets } from './helpers.js'
import { describe, expect, it } from 'vitest'

describe('WebSocketApi', () => {
  it('Should be built', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i, { port: 19998 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      useWebsockets(i, { path: '/web-socket', port: 19996 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })

  it('Should broadcast messages', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect.assertions(4) // All 4 clients should receive the message
      useWebsockets(i, { path: '/web-socket', port: 19994 })
      const api = i.getInstance(WebSocketApi)
      await Promise.all(
        [1, 2, 3, 4, 5].map(async (idx) => {
          const client = new WebSocket('ws://localhost:19994/web-socket')
          await new Promise<void>((resolve) =>
            client.once('open', () => {
              if (idx === 5) {
                client.close()
                client.terminate()
              }
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
    await usingAsync(new Injector(), async (i) => {
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

      useWebsockets(i, { path: '/web-socket', port: 19995, actions: [ExampleWsAction] })
      const client = new WebSocket('ws://localhost:19995/web-socket')
      await new Promise<void>((resolve) => client.once('open', () => resolve()))

      await new Promise<void>((resolve, reject) =>
        client.send(JSON.stringify(data), (err) => (err ? reject(err) : resolve())),
      )
      client.close()
      await new Promise<void>((resolve) => client.once('close', () => resolve()))
    })
  })
})
