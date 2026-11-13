import { getPort } from '@furystack/core/port-generator'
import type { IncomingMessage, ServerResponse } from 'http'
import { createServer, request } from 'http'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { buildStaticSiteServerApi } from './static-site-runtime.js'

const makeRequest = (url: string | undefined, method: string | undefined = 'GET'): IncomingMessage =>
  ({ url, method, headers: {} }) as unknown as IncomingMessage

// Full onRequest / sendFile behaviour (streaming, fallback, 404) is covered
// end-to-end via `static-server-manager.spec.ts` which drives the real HTTP
// pool. These tests cover the pure-function `shouldExec` gate which is
// exercised by the server pool before any request is handed to the API.
describe('buildStaticSiteServerApi / shouldExec', () => {
  const api = buildStaticSiteServerApi({ baseUrl: '/static', path: '/tmp', port: 0 })

  it('matches GET requests under the baseUrl', () => {
    expect(api.shouldExec({ req: makeRequest('/static/index.html'), res: {} as ServerResponse })).toBe(true)
  })

  it('is case-insensitive about the method (GET only)', () => {
    expect(api.shouldExec({ req: makeRequest('/static/a.html', 'get'), res: {} as ServerResponse })).toBe(true)
  })

  it('rejects non-GET methods', () => {
    expect(api.shouldExec({ req: makeRequest('/static/index.html', 'POST'), res: {} as ServerResponse })).toBe(false)
    expect(api.shouldExec({ req: makeRequest('/static/index.html', 'DELETE'), res: {} as ServerResponse })).toBe(false)
  })

  it('rejects URLs that do not match the baseUrl', () => {
    expect(api.shouldExec({ req: makeRequest('/other/index.html'), res: {} as ServerResponse })).toBe(false)
  })

  it('rejects requests without a URL', () => {
    expect(api.shouldExec({ req: makeRequest(undefined), res: {} as ServerResponse })).toBe(false)
  })

  it('never exposes an onUpgrade hook (static sites do not handle upgrades)', () => {
    expect(api.onUpgrade).toBeUndefined()
  })
})

describe('buildStaticSiteServerApi / onRequest stream lifecycle', () => {
  it('resolves when the client disconnects mid-stream', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'furystack-static-'))
    const file = join(dir, 'big.txt')
    await writeFile(file, 'x'.repeat(1024 * 1024))
    const port = getPort()
    const api = buildStaticSiteServerApi({ baseUrl: '/', path: dir, port })
    const server = createServer((req, res) => {
      void api.onRequest({ req, res }).catch(() => undefined)
    })

    try {
      await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
      const settled = await new Promise<string>((resolve, reject) => {
        const req = request({ hostname: '127.0.0.1', port, path: '/big.txt', method: 'GET' }, (res) => {
          res.once('data', () => {
            req.destroy()
            setTimeout(() => resolve('ok'), 100)
          })
        })
        req.on('error', () => undefined)
        req.end()
        setTimeout(() => reject(new Error('timeout')), 1000)
      })
      expect(settled).toBe('ok')
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
      await rm(dir, { recursive: true, force: true })
    }
  })
})
