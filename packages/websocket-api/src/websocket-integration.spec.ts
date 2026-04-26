import { InMemoryStore, User as UserModel, useSystemIdentityContext, type User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { createInjector, type Injector } from '@furystack/inject'
import {
  DefaultSession,
  HttpUserContext,
  SessionStore,
  UserDataSet,
  UserResolutionCache,
  UserStore,
  useHttpAuthentication,
  useRestService,
} from '@furystack/rest-service'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { WhoAmI } from './actions/whoami.js'
import { useWebSocketApi } from './websocket-api.js'

const bindAuthStores = (i: Injector): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  usePasswordPolicy(i)
}

describe('WebSocket Integration tests', () => {
  const host = 'localhost'
  const path = '/ws'

  const setupWebSocket = async () => {
    const injector = createInjector()
    const port = getPort()
    const createdClients: WebSocket[] = []

    bindAuthStores(injector)
    useHttpAuthentication(injector)
    await useRestService({ injector, api: {}, root: '', port, hostName: host })
    await useWebSocketApi({ injector, actions: [WhoAmI], path, port, hostName: host })

    const client = await new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`ws://${host}:${port}${path}`)
      createdClients.push(ws)
      ws.on('open', () => resolve(ws)).on('error', reject)
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
      const testUser = { username: 'test', password: 'test', roles: [] } as unknown as User

      const userStore = injector.get(UserStore)
      await userStore.add(testUser)

      // Performing login/logout through a disposable setup scope keeps
      // `HttpUserContext` (scoped) from being cached on the root injector.
      // Per-connection message scopes then resolve their own fresh instance
      // each time, so server-side state changes (role updates, logout)
      // surface on the next websocket message.
      let cookie = ''
      await usingAsync(injector.createScope({ owner: 'ws-login' }), async (setupScope) => {
        await setupScope.get(HttpUserContext).cookieLogin(testUser, {
          setHeader: (_name: string, value: string) => {
            cookie = value
          },
        })
      })

      const authenticatedClient = await new Promise<WebSocket>((done, reject) => {
        const cl = new WebSocket(`ws://${host}:${port}${path}`, {
          headers: { cookie },
        })
        createdClients.push(cl)
        cl.once('open', () => {
          done(cl)
        }).once('error', reject)
      })
      const whoAmIResult = await getWhoAmIResult(authenticatedClient)
      expect(whoAmIResult.currentUser).toEqual(testUser)

      await usingAsync(useSystemIdentityContext({ injector, username: 'test' }), async (systemScope) => {
        const userDataSet = systemScope.get(UserDataSet)
        await userDataSet.update(systemScope, testUser.username, { ...testUser, roles: ['newFancyRole'] })
      })

      // Out-of-band mutations to the user record do not propagate through the
      // user-resolution cache automatically; apps that mutate roles in
      // storage must explicitly invalidate the cache so the next request
      // re-walks the auth providers.
      injector.get(UserResolutionCache).invalidateAll()

      const updatedWhoAmIResult = await getWhoAmIResult(authenticatedClient)
      expect(updatedWhoAmIResult.currentUser.roles).toEqual(['newFancyRole'])

      await usingAsync(injector.createScope({ owner: 'ws-logout' }), async (logoutScope) => {
        await logoutScope.get(HttpUserContext).cookieLogout({ headers: { cookie } }, { setHeader: vi.fn() })
      })

      const loggedOutWhoAmIResult = await getWhoAmIResult(authenticatedClient)
      expect(loggedOutWhoAmIResult.currentUser).toBe(null)
    })
  })
})
