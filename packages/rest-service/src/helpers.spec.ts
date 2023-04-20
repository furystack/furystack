import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ApiManager } from './api-manager'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { useHttpAuthentication, useRestService, useStaticFiles } from './helpers'
import { StaticServerManager } from './static-server-manager'
import { describe, it, expect } from 'vitest'

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
        await useRestService({ injector: i, api: {}, root: '/', port: 1234 })
        expect(i.cachedSingletons.get(ApiManager)).toBeDefined()
      })
    })
  })

  describe('useRestService()', () => {
    it('Should set up a REST service', async () => {
      await usingAsync(new Injector(), async (i) => {
        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port: 1234 })
        expect(i.cachedSingletons.get(StaticServerManager)).toBeDefined()
      })
    })
  })
})
