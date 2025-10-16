import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { ApiManager } from './api-manager.js'
import { useHttpAuthentication, useProxy, useRestService, useStaticFiles } from './helpers.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import { ProxyManager } from './proxy-manager.js'
import { StaticServerManager } from './static-server-manager.js'

describe('Injector extensions', () => {
  describe('useHttpAuthentication', () => {
    it('Should set up HTTP Authentication', async () => {
      await usingAsync(new Injector(), async (i) => {
        useHttpAuthentication(i)
        expect(i.cachedSingletons.get(HttpAuthenticationSettings)).toBeDefined()
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
