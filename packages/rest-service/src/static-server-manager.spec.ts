import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { useStaticFiles } from './helpers.js'
import { HttpServerPoolToken } from './http-server-pool.js'
import { buildStaticSiteServerApi } from './static-site-runtime.js'

describe('useStaticFiles / buildStaticSiteServerApi', () => {
  describe('Top level routing', () => {
    it('responds 404 without a fallback', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })

        const result = await fetch(`http://127.0.0.1:${port}/not-found.html`)
        expect(result.ok).toBe(false)
        expect(result.status).toBe(404)
        expect(result.headers.get('content-type')).toBe('text/plain')
        expect(await result.text()).toBe('Not found')
      })
    })

    it('falls back to the configured file and returns its content-type', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({
          injector: i,
          baseUrl: '/',
          path: '.',
          fallback: 'package.json',
          port,
          headers: { 'custom-header': 'custom-value' },
        })

        const result = await fetch(`http://localhost:${port}/not-found.html`)
        expect(result.headers.get('content-type')).toBe('application/json')
        expect(result.headers.get('custom-header')).toBe('custom-value')
      })
    })

    it('falls back for the root url when no index exists', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({
          injector: i,
          baseUrl: '/',
          path: '.',
          fallback: 'package.json',
          port,
          headers: { 'custom-header': 'custom-value' },
        })

        const result = await fetch(`http://localhost:${port}`)
        expect(result.headers.get('content-type')).toBe('application/json')
        expect(result.headers.get('custom-header')).toBe('custom-value')
      })
    })

    it('serves an existing file from the root directory', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })
        const result = await fetch(`http://localhost:${port}/README.md`)
        expect(result.headers.get('content-type')).toBe('text/markdown')
      })
    })

    it('serves files from subdirectories', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({ injector: i, baseUrl: '/', path: '.', port })
        const result = await fetch(`http://localhost:${port}/packages/utils/README.md`)
        expect(result.headers.get('content-type')).toBe('text/markdown')
      })
    })
  })

  describe('Non-top level routing', () => {
    it('leaves requests outside the base url to the next api in the chain', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        const serverApi = await useStaticFiles({ injector: i, baseUrl: '/bundle', path: '.', port })

        const record = await i.get(HttpServerPoolToken).acquire({ port })
        const onRequest = vi.fn()
        // Swap in a spy to observe non-matching requests never reach the handler.
        serverApi.onRequest = onRequest
        record.apis[0] = serverApi

        fetch(`http://localhost:${port}/bundleToAnotherFolder/not-found.html`).catch(() => {
          // Expected to fail: the server has no matching API and drops the socket.
        })
        await sleepAsync(100)
        expect(onRequest).not.toHaveBeenCalled()
      })
    })

    it('returns 404 under a sub-base url when the file is missing and no fallback is set', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({ injector: i, baseUrl: '/bundle', path: '.', port })

        const result = await fetch(`http://localhost:${port}/bundle/not-found.html`)
        expect(result.ok).toBe(false)
        expect(result.status).toBe(404)
        expect(result.headers.get('content-type')).toBe('text/plain')
        expect(await result.text()).toBe('Not found')
      })
    })

    it('serves the configured fallback under a sub-base url', async () => {
      await usingAsync(createInjector(), async (i) => {
        const port = getPort()
        await useStaticFiles({ injector: i, baseUrl: '/bundle', path: '.', fallback: 'package.json', port })

        const result = await fetch(`http://localhost:${port}/bundle/not-found.html`)
        expect(result.headers.get('content-type')).toBe('application/json')
      })
    })
  })

  describe('shouldExec', () => {
    const api = (baseUrl: string) => buildStaticSiteServerApi({ baseUrl, path: '.', port: 0 })

    it('does not match when the request method is missing', () => {
      expect(api('/').shouldExec({ req: { url: '/' } as never, res: {} as never })).toBe(false)
    })

    it('does not match non-GET methods', () => {
      expect(api('/').shouldExec({ req: { method: 'POST', url: '/' } as never, res: {} as never })).toBe(false)
    })

    const positiveCases: Array<[string, string]> = [
      ['/', '/'],
      ['/', '/index.html'],
      ['/', '/subdir'],
      ['/', '/subdir/'],
      ['/', '/subdir/file.js'],
      ['/subdir', '/subdir'],
      ['/subdir', '/subdir/'],
      ['/subdir', '/subdir/file.js'],
      ['/subdir', '/subdir/s2/file.js'],
    ]
    positiveCases.forEach(([baseUrl, url]) =>
      it(`matches GET '${url}' against base '${baseUrl}'`, () => {
        expect(api(baseUrl).shouldExec({ req: { method: 'GET', url } as never, res: {} as never })).toBe(true)
      }),
    )

    it('does not match unrelated urls under a non-root base', () => {
      const subdir = api('/subdir')
      expect(subdir.shouldExec({ req: { method: 'GET', url: '/' } as never, res: {} as never })).toBe(false)
      expect(subdir.shouldExec({ req: { method: 'GET', url: '/other/index.html' } as never, res: {} as never })).toBe(
        false,
      )
      expect(subdir.shouldExec({ req: { method: 'GET', url: '/subdir2' } as never, res: {} as never })).toBe(false)
      expect(subdir.shouldExec({ req: { method: 'GET', url: '/subdir2/index.html' } as never, res: {} as never })).toBe(
        false,
      )
    })
  })
})
