import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import got, { RequestError } from 'got'
import { ServerManager } from './server-manager'
import { StaticServerManager } from './static-server-manager'

describe('StaticServerManager', () => {
  describe('Top level routing', () => {
    it('Should return a 404 without fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
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
          baseUrl: '/',
          path: '.',
          fallback: 'package.json',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/not-found.html')

        expect(result.headers['content-type']).toBe('application/json')
      })
    })

    it('Should return a defined file from a root directory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/readme.md')

        expect(result.headers['content-type']).toBe('text/markdown')
      })
    })

    it('Should return a defined file from a subdirectory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/packages/utils/readme.md')

        expect(result.headers['content-type']).toBe('text/markdown')
      })
    })
  })

  describe('Non-top level routing', () => {
    it('Should not handle a request when the path is not matching', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/bundle',
          path: '.',
          port: 1234,
        })

        const server = [...injector.getInstance(ServerManager).servers.values()][0]

        server.apis[0].onRequest = jest.fn()

        got.get('http://localhost:1234/bundleToAnotherFolder/not-found.html')

        await sleepAsync(100)

        expect(server.apis[0].onRequest).not.toHaveBeenCalled()
      })
    })

    it('Should return a 404 without fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/bundle',
          path: '.',
          port: 1234,
        })

        try {
          await got.get('http://localhost:1234/bundle/not-found.html')
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
          baseUrl: '/bundle',
          path: '.',
          fallback: 'package.json',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/bundle/not-found.html')

        expect(result.headers['content-type']).toBe('application/json')
      })
    })

    it('Should return a defined file from a root directory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/readme.md')

        expect(result.headers['content-type']).toBe('text/markdown')
      })
    })

    it('Should return a defined file from a subdirectory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port: 1234,
        })

        const result = await got.get('http://localhost:1234/packages/utils/readme.md')

        expect(result.headers['content-type']).toBe('text/markdown')
      })
    })
  })

  describe('shouldExec', () => {
    it('Should NOT match for requests with not defined method', () => {
      const staticServerManager = new StaticServerManager()
      expect(staticServerManager.shouldExec('/')({ req: { url: '/' } })).toBe(false)
    })

    it('Should NOT match for non-GET requests', () => {
      const staticServerManager = new StaticServerManager()
      expect(staticServerManager.shouldExec('/')({ req: { method: 'POST', url: '/' } })).toBe(false)
    })
    ;[
      ['/', '/'],
      ['/', '/index.html'],
      ['/', '/subdir'],
      ['/', '/subdir/'],
      ['/', '/subdir/file.js'],
      ['/subdir', '/subdir'],
      ['/subdir', '/subdir/'],
      ['/subdir', '/subdir/file.js'],
      ['/subdir', '/subdir/s2/file.js'],
    ].forEach(([root, url]) =>
      it(`Should match for '${root}' root and '${url}' url`, () => {
        const staticServerManager = new StaticServerManager()
        const shouldExec = staticServerManager.shouldExec(root)({ req: { method: 'GET', url } })
        expect(shouldExec).toBe(true)
      }),
    )

    it('Should not exec different paths for non-top level root directory', () => {
      const staticServerManager = new StaticServerManager()
      expect(staticServerManager.shouldExec('/subdir')({ req: { method: 'GET', url: '/' } })).toBe(false)
      expect(staticServerManager.shouldExec('/subdir')({ req: { method: 'GET', url: '/other/index.html' } })).toBe(
        false,
      )
      expect(staticServerManager.shouldExec('/subdir')({ req: { method: 'GET', url: '/subdir2' } })).toBe(false)
      expect(staticServerManager.shouldExec('/subdir')({ req: { method: 'GET', url: '/subdir2/index.html' } })).toBe(
        false,
      )
    })
  })
})