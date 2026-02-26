import { InMemoryStore, User, addStore } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { ApiManager } from './api-manager.js'
import { useHttpAuthentication, useProxy, useRestService, useStaticFiles } from './helpers.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import { DefaultSession } from './models/default-session.js'
import { ProxyManager } from './proxy-manager.js'
import { StaticServerManager } from './static-server-manager.js'

const setupAuthStores = (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  const repo = getRepository(i)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(PasswordResetToken, 'token')
  usePasswordPolicy(i)
}

describe('Injector extensions', () => {
  describe('useHttpAuthentication', () => {
    it('Should set up HTTP Authentication', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i)
        expect(i.cachedSingletons.get(HttpAuthenticationSettings)).toBeDefined()
      })
    })

    it('Should register basic-auth and cookie-auth providers by default', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i)
        const settings = i.getInstance(HttpAuthenticationSettings)
        const providerNames = settings.authenticationProviders.map((p) => p.name)
        expect(providerNames).toContain('basic-auth')
        expect(providerNames).toContain('cookie-auth')
      })
    })

    it('Should not register basic-auth provider when disabled', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupAuthStores(i)
        useHttpAuthentication(i, { enableBasicAuth: false })
        const settings = i.getInstance(HttpAuthenticationSettings)
        const providerNames = settings.authenticationProviders.map((p) => p.name)
        expect(providerNames).not.toContain('basic-auth')
        expect(providerNames).toContain('cookie-auth')
      })
    })
  })

  describe('useRestService()', () => {
    it('Should set up a REST service', async () => {
      await usingAsync(new Injector(), async (i) => {
        const port = getPort()

        await useRestService({ injector: i, api: {}, root: '/', port })
        expect(i.cachedSingletons.get(ApiManager)).toBeDefined()
      })
    })
  })

  describe('useStaticFiles()', () => {
    it('Should set up a static file server', async () => {
      await usingAsync(new Injector(), async (i) => {
        const port = getPort()

        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })
        expect(i.cachedSingletons.get(StaticServerManager)).toBeDefined()
      })
    })
  })

  describe('useProxy()', () => {
    it('Should set up a proxy server', async () => {
      await usingAsync(new Injector(), async (i) => {
        const sourcePort = getPort()
        const targetPort = getPort()

        await useProxy({
          injector: i,
          sourceBaseUrl: '/api',
          targetBaseUrl: `http://localhost:${targetPort}`,
          sourcePort,
        })
        expect(i.cachedSingletons.get(ProxyManager)).toBeDefined()
      })
    })
  })
})
