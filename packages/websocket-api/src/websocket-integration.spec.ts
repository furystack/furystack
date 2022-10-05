import { Injector } from '@furystack/inject'
import { WhoAmI } from './actions/whoami'
import ws from 'ws'
import { addStore, InMemoryStore, User } from '@furystack/core'
import { DefaultSession, ServerManager, useHttpAuthentication } from '@furystack/rest-service'
import { useRestService } from '@furystack/rest-service'
import { useWebsockets } from './helpers'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const port = 9999
  const path = '/ws'
  let i!: Injector
  let client: ws

  beforeEach((done) => {
    i = new Injector()
    useRestService({
      injector: i,
      api: {},
      root: '',
      port,
      hostName: host,
    })
    addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
      new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
    )
    useHttpAuthentication(i, {})
    useWebsockets(i, { actions: [WhoAmI], path, port, host })
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
