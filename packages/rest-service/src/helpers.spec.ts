import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ApiManager } from './api-manager.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import { useHttpAuthentication, useRestService, useStaticFiles } from './helpers.js'
import { StaticServerManager } from './static-server-manager.js'
import { describe, it, expect } from 'vitest'
import { getPort } from '@furystack/core/port-generator'

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

  describe('useRestService()', () => {
    it('Should set up a REST service', async () => {
      await usingAsync(new Injector(), async (i) => {
        const port = getPort()

        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })
        expect(i.cachedSingletons.get(StaticServerManager)).toBeDefined()
      })
    })
  })
})
