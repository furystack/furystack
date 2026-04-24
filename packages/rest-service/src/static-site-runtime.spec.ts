import type { IncomingMessage, ServerResponse } from 'http'
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
