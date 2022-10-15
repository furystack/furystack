import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { ServerManager } from './server-manager.js'
import { StaticServerManager } from './static-server-manager.js'
import { describe, expect, it, vi } from 'vitest'

/**
 * Generator for an incremental port number
 *
 * @param initialPort The initial port number
 * @yields a port for testing
 * @returns The Port number
 */
function* getPort(initialPort = 1234) {
  let port = initialPort

  while (true) {
    yield port++
  }
  return port
}

describe('StaticServerManager', () => {
  const portGenerator = getPort()

  describe('Top level routing', () => {
    it('Should return a 404 without fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value
        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port,
        })

        const result = await fetch(`http://localhost:${port}/not-found.html`)
        expect(result.status).toBe(404)
        expect(result.headers.get('content-type')).toBe('text/plain')
        const body = await result.text()
        expect(body).toBe('Not found')
      })
    })

    it('Should return a fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          fallback: 'package.json',
          port,
          headers: {
            'custom-header': 'custom-value',
          },
        })

        const result = await fetch(`http://localhost:${port}/not-found.html`)

        expect(result.headers.get('content-type')).toBe('application/json')
        expect(result.headers.get('custom-header')).toBe('custom-value')
      })
    })

    it('Should return a fallback for root files', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          fallback: 'package.json',
          port,
          headers: {
            'custom-header': 'custom-value',
          },
        })

        const result = await fetch(`http://localhost:${port}`)

        expect(result.headers.get('content-type')).toBe('application/json')
        expect(result.headers.get('custom-header')).toBe('custom-value')
      })
    })

    it('Should return a defined file from a root directory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port,
          headers: {
            'custom-header': 'custom-value',
          },
        })

        const result = await fetch(`http://localhost:${port}/README.md`)

        expect(result.headers.get('content-type')).toBe('text/markdown')
        expect(result.headers.get('custom-header')).toBe('custom-value')
      })
    })

    it('Should return a defined file from a subdirectory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port,
        })

        const result = await fetch(`http://localhost:${port}/packages/utils/README.md`)

        expect(result.headers.get('content-type')).toBe('text/markdown')
      })
    })
  })

  describe('Non-top level routing', () => {
    it('Should not handle a request when the path is not matching', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/bundle',
          path: '.',
          port,
        })

        const server = [...injector.getInstance(ServerManager).servers.values()][0]

        server.apis[0].onRequest = vi.fn()

        fetch(`http://localhost:${port}/bundleToAnotherFolder/not-found.html`)

        await sleepAsync(100)

        expect(server.apis[0].onRequest).not.toHaveBeenCalled()
      })
    })

    it('Should return a 404 without fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/bundle',
          path: '.',
          port,
        })

        const result = await fetch(`http://localhost:${port}/bundle/not-found.html`)
        expect(result.status).toBe(404)
        expect(result.headers.get('content-type')).toBe('text/plain')

        const body = await result.text()
        expect(body).toBe('Not found')
      })
    })

    it('Should return a fallback', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/bundle',
          path: '.',
          fallback: 'package.json',
          port,
        })

        const result = await fetch(`http://localhost:${port}/bundle/not-found.html`)

        expect(result.headers.get('content-type')).toBe('application/json')
      })
    })

    it('Should return a defined file from a root directory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port,
        })

        const result = await fetch(`http://localhost:${port}/README.md`)

        expect(result.headers.get('content-type')).toBe('text/markdown')
      })
    })

    it('Should return a defined file from a subdirectory', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const staticServerManager = injector.getInstance(StaticServerManager)
        const port = portGenerator.next().value

        await staticServerManager.addStaticSite({
          baseUrl: '/',
          path: '.',
          port,
        })

        const result = await fetch(`http://localhost:${port}/packages/utils/README.md`)

        expect(result.headers.get('content-type')).toBe('text/markdown')
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
