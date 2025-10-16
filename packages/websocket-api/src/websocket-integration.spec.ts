import { addStore, InMemoryStore, StoreManager, User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import {
  DefaultSession,
  HttpUserContext,
  ServerManager,
  useHttpAuthentication,
  useRestService,
} from '@furystack/rest-service'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { WhoAmI } from './actions/whoami.js'
import { useWebsockets } from './helpers.js'

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const path = '/ws'
  let i!: Injector
  let client: WebSocket
  let port: number
  const createdClients: WebSocket[] = []

  beforeEach(async () => {
    i = new Injector()
    port = getPort()
    await useRestService({
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
    await useWebsockets(i, { actions: [WhoAmI], path, port, host })

    await new Promise<void>((resolve, reject) => {
      i.getInstance(ServerManager)
        .getOrCreate({ port })
        .then(() => {
          client = new WebSocket(`ws://${host}:${port}/ws`)
          createdClients.push(client)
          client
            .on('open', () => {
              resolve()
            })
            .on('error', reject)
        })
        .catch(reject)
    })
  })

  afterEach(async () => {
    // Close all WebSocket clients before disposing the injector
    createdClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    })
    createdClients.length = 0
    await i[Symbol.asyncDispose]()
  })
  const getWhoAmIResult = async (subjectClient: WebSocket) => {
    return new Promise<{ currentUser: User }>((resolve, reject) => {
      subjectClient.once('message', (data: Buffer) => {
        resolve(JSON.parse(data.toString()) as { currentUser: User })
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
    await userStore.add(testUser)

    const userCtx = i.getInstance(HttpUserContext)

    let cookie = ''
    await userCtx.cookieLogin(testUser, {
      setHeader: (_setCookie, cookieValue) => {
        cookie = cookieValue
      },
    })

    const authenticatedClient = await new Promise<WebSocket>((done, reject) => {
      const cl = new WebSocket(`ws://${host}:${port}/ws`, {
        headers: { cookie },
      })
      createdClients.push(cl)
      cl.once('open', () => {
        done(cl)
      }).once('error', reject)
    })
    const whoAmIResult = await getWhoAmIResult(authenticatedClient)
    expect(whoAmIResult.currentUser).toEqual(testUser)

    await userStore.update(testUser.username, { ...testUser, roles: ['newFancyRole'] })

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
