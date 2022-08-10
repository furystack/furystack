import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import got, { RequestError } from 'got'
import { StaticServerManager } from './static-server-manager'

describe('StaticServerManager', () => {
  it('Should return a 404 without fallback', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const staticServerManager = injector.getInstance(StaticServerManager)

      await staticServerManager.addStaticSite({
        hostName: 'localhost',
        baseUrl: '/',
        path: '.',
        port: 1234,
      })

      try {
        await got.get('http://localhost:1234/not-found.html')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        const requestError: RequestError = error as RequestError

        expect(requestError.response?.statusCode).toBe(404)
        expect(requestError.response?.headers['content-type']).toBe('text/plain')
        expect(requestError.response?.body).toBe('Not found')
      }
    })
  })

  it('Should return a fallback', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const staticServerManager = injector.getInstance(StaticServerManager)

      await staticServerManager.addStaticSite({
        hostName: 'localhost',
        baseUrl: '/',
        path: '.',
        fallback: 'package.json',
        port: 1234,
      })

      const result = await got.get('http://localhost:1234/not-found.html')

      expect(result.headers['content-type']).toBe('application/json')
    })
  })
})
