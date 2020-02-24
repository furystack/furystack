import { Injector } from '@furystack/inject'
import { WhoAmI } from './actions/whoami'
import '.'
import '@furystack/http-api'
import ws from 'ws'
import { InMemoryStore, User } from '@furystack/core'
import { DefaultSession } from '@furystack/http-api'

describe('WebSocket Integration tests', () => {
  const port = 9999
  const path = '/ws'
  const i = new Injector()
    .useHttpApi()
    .setupStores(sm =>
      sm
        .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
        .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
    )
    .useHttpAuthentication({})
    .listenHttp({ port })
    .useWebsockets({ actions: [WhoAmI], path })
  const client = new ws(`ws://127.0.0.1:${port}/ws`)

  beforeAll(done =>
    client.on('open', () => {
      done()
    }),
  )

  afterAll(async () => {
    i.dispose()
    client.close()
  })

  it('Should be connected', done => {
    client.on('message', data => {
      expect(data.toString()).toBe('{"currentUser":null}')
      client.close()
      done()
    })
    client.send('whoami')
  })
})
