import { Injector } from '@furystack/inject'
import { WhoAmI } from './actions/whoami'
import '.'
import ws from 'ws'
import { InMemoryStore, User } from '@furystack/core'
import { DefaultSession, ServerManager } from '@furystack/rest-service'

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const port = 9999
  const path = '/ws'
  let i!: Injector
  let client: ws

  beforeEach((done) => {
    i = new Injector()
    i.useRestService({
      api: {},
      root: '',
      port,
      hostName: host,
    })
    i.setupStores((sm) =>
      sm
        .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
        .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
    )
      .useHttpAuthentication({})
      .useWebsockets({ actions: [WhoAmI], path, port, host })
    i.getInstance(ServerManager)
      .getOrCreate({ port })
      .then(() => {
        client = new ws(`ws://${host}:${port}/ws`)
        client
          .on('open', () => {
            done()
          })
          .on('error', done)
      })
  })

  afterEach(async () => {
    await i.dispose()
  })

  it('Should be connected', (done) => {
    client.on('message', (data) => {
      expect(data.toString()).toBe('{"currentUser":null}')
      client.close()
      done()
    })
    client.send('whoami')
  })
})
