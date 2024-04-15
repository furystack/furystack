import { Injector } from '@furystack/inject'
import { WhoAmI } from './actions/whoami.js'
import { WebSocket } from 'ws'
import { addStore, InMemoryStore, StoreManager, User } from '@furystack/core'
import { DefaultSession, HttpUserContext, ServerManager, useHttpAuthentication } from '@furystack/rest-service'
import { useRestService } from '@furystack/rest-service'
import { useWebsockets } from './helpers.js'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPort } from '@furystack/core/port-generator'

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const path = '/ws'
  let i!: Injector
  let client: WebSocket
  let port: number

  beforeEach(async () => {
    i = new Injector()
    port = getPort()
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

    await new Promise<void>((done, reject) => {
      i.getInstance(ServerManager)
        .getOrCreate({ port })
        .then(() => {
          client = new WebSocket(`ws://${host}:${port}/ws`)
          client
            .on('open', () => {
              done()
            })
            .on('error', reject)
        })
    })
  })

  afterEach(async () => {
    await i.dispose()
  })
  const getWhoAmIResult = async (subjectClient: WebSocket) => {
    return new Promise<{ currentUser: User }>((resolve, reject) => {
      subjectClient.once('message', (data: any) => {
        resolve(JSON.parse(data.toString()))
      })
      subjectClient.once('error', reject)
      subjectClient.send('whoami')
    })
  }

  describe('Authentication', () => {
    it('Should be unauthenticated by default', async () => {
      expect((await getWhoAmIResult(client)).currentUser).toBe(null)
    })
  })

  it('Should be authenticated, roles should be updated and should be logged out', async () => {
    const testUser = { username: 'test', password: 'test', roles: [] } as User

    const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
    userStore.add(testUser)

    const userCtx = i.getInstance(HttpUserContext)

    let cookie = ''
    await userCtx.cookieLogin(testUser, {
      setHeader: (_setCookie, cookieValue) => {
        cookie = cookieValue as string
        return {} as any
      },
    })

    const authenticatedClient = await new Promise<WebSocket>((done, reject) => {
      const cl = new WebSocket(`ws://${host}:${port}/ws`, {
        headers: { cookie },
      })
      cl.once('open', () => {
        done(cl)
      }).once('error', reject)
    })
    const whoAmIResult = await getWhoAmIResult(authenticatedClient)
    expect(whoAmIResult.currentUser).toEqual(testUser)

    userStore.update(testUser.username, { ...testUser, roles: ['newFancyRole'] })

    const updatedWhoAmIResult = await getWhoAmIResult(authenticatedClient)
    expect(updatedWhoAmIResult.currentUser.roles).toEqual(['newFancyRole'])

    await userCtx.cookieLogout(
      {
        headers: {
          cookie,
        },
      },
      {
        setHeader: vi.fn(),
      },
    )

    const loggedOutWhoAmIResult = await getWhoAmIResult(authenticatedClient)
    expect(loggedOutWhoAmIResult.currentUser).toBe(null)
  })
})
