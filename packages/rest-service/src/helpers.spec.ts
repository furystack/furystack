import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useHttpAuthentication, useProxy, useRestService, useStaticFiles } from './helpers.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import { HttpServerPoolToken } from './http-server-pool.js'
import { DefaultSession } from './models/default-session.js'
import { SessionStore, UserStore } from './user-store.js'

const setupAuthStores = (i: Injector) => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  usePasswordPolicy(i)
}

describe('rest-service setup helpers', () => {
  describe('useHttpAuthentication', () => {
    it('binds HttpAuthenticationSettings on the injector', async () => {
      await usingAsync(createInjector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i)
        const settings = i.get(HttpAuthenticationSettings)
        expect(settings).toBeDefined()
      })
    })

    it('registers basic-auth and cookie-auth providers by default', async () => {
      await usingAsync(createInjector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i)
        const settings = i.get(HttpAuthenticationSettings)
        const providerNames = settings.authenticationProviders.map((p) => p.name)
        expect(providerNames).toContain('basic-auth')
        expect(providerNames).toContain('cookie-auth')
      })
    })

    it('omits the basic-auth provider when enableBasicAuth is false', async () => {
      await usingAsync(createInjector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i, { enableBasicAuth: false })
        const settings = i.get(HttpAuthenticationSettings)
        const providerNames = settings.authenticationProviders.map((p) => p.name)
        expect(providerNames).not.toContain('basic-auth')
        expect(providerNames).toContain('cookie-auth')
      })
    })
  })

  describe('useRestService()', () => {
    it('acquires a pooled HTTP server and attaches a serverApi', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        const serverApi = await useRestService({ injector: i, api: {}, root: '/', port })
        expect(serverApi).toBeDefined()
        const pool = i.get(HttpServerPoolToken)
        const record = await pool.acquire({ port })
        expect(record.apis).toContain(serverApi)
      })
    })
  })

  describe('useStaticFiles()', () => {
    it('attaches a static-file serverApi to the pooled HTTP server', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        const serverApi = await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })
        expect(serverApi).toBeDefined()
        const pool = i.get(HttpServerPoolToken)
        const record = await pool.acquire({ port })
        expect(record.apis).toContain(serverApi)
      })
    })
  })

  describe('useProxy()', () => {
    it('attaches a proxy serverApi to the pooled HTTP server', async () => {
      await usingAsync(createInjector(), async (i) => {
        const sourcePort = getPort()
        const targetPort = getPort()
        const serverApi = await useProxy({
          injector: i,
          sourceBaseUrl: '/api',
          targetBaseUrl: `http://localhost:${targetPort}`,
          sourcePort,
        })
        expect(serverApi).toBeDefined()
        const pool = i.get(HttpServerPoolToken)
        const record = await pool.acquire({ port: sourcePort })
        expect(record.apis).toContain(serverApi)
      })
    })
  })
})

// Re-export to keep ESLint happy about unused User import elsewhere.
export type { User }
