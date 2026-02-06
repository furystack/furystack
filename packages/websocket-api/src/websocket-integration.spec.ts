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
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { WhoAmI } from './actions/whoami.js'
import { useWebsockets } from './helpers.js'

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const path = '/ws'

  const setupWebSocket = async () => {
    const injector = new Injector()
    const port = getPort()
    const createdClients: WebSocket[] = []

    await useRestService({
      injector,
      api: {},
      root: '',
      port,
      hostName: host,
    })
    addStore(injector, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
      new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
    )
    useHttpAuthentication(injector, {})
    await useWebsockets(injector, { actions: [WhoAmI], path, port, host })

    const client = await new Promise<WebSocket>((resolve, reject) => {
      injector
        .getInstance(ServerManager)
        .getOrCreate({ port })
        .then(() => {
          const ws = new WebSocket(`ws://${host}:${port}/ws`)
          createdClients.push(ws)
          ws.on('open', () => resolve(ws)).on('error', reject)
        })
        .catch(reject)
    })

    return {
      injector,
      client,
      createdClients,
      port,
      [Symbol.asyncDispose]: async () => {
        createdClients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close()
          }
        })
        createdClients.length = 0
        await injector[Symbol.asyncDispose]()
      },
    }
  }

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
      await usingAsync(await setupWebSocket(), async ({ client }) => {
        expect((await getWhoAmIResult(client)).currentUser).toBe(null)
      })
    })
  })

  it('Should be authenticated, roles should be updated and should be logged out', async () => {
    await usingAsync(await setupWebSocket(), async ({ injector, createdClients, port }) => {
      const testUser = { username: 'test', password: 'test', roles: [] } as User

      const userStore = injector.getInstance(StoreManager).getStoreFor(User, 'username')
      await userStore.add(testUser)

      const userCtx = injector.getInstance(HttpUserContext)

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
})
