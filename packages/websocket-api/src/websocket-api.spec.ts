import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { WebSocketApi } from './websocket-api'
import './injector-extensions'
import WebSocket from 'ws'

describe('WebSocketApi', () => {
  it('Should be built', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useWebsockets({ port: 19998 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })
  it('Should be built with settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useWebsockets({ path: '/web-socket', port: 19996 })
      expect(i.getInstance(WebSocketApi)).toBeInstanceOf(WebSocketApi)
    })
  })

  it('Should broadcast messages', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useWebsockets({ path: '/web-socket', port: 19994 })
      const api = i.getInstance(WebSocketApi)
      await Promise.all(
        [1, 2, 3, 4].map(async () => {
          const client = new WebSocket('ws://localhost:19994/web-socket')
          await new Promise<void>((resolve) => client.once('open', () => resolve()))
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
})
