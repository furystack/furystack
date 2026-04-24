import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildProxyServerApi, type ProxyOptions } from './proxy-runtime.js'
import { ServerTelemetry } from './server-telemetry.js'

const baseOptions: ProxyOptions = {
  sourceBaseUrl: '/api',
  sourcePort: 0,
  targetBaseUrl: 'http://upstream.invalid:8080',
}

describe('buildProxyServerApi', () => {
  let telemetry: ServerTelemetry

  beforeEach(() => {
    telemetry = new ServerTelemetry()
  })
  afterEach(() => {
    telemetry[Symbol.dispose]()
  })

  it('returns a ServerApi whose shouldExec matches URLs under the sourceBaseUrl', () => {
    const api = buildProxyServerApi(baseOptions, telemetry)
    expect(api.shouldExec({ req: { url: '/api/items', method: 'GET' } as never, res: {} as never })).toBe(true)
    expect(api.shouldExec({ req: { url: '/other', method: 'GET' } as never, res: {} as never })).toBe(false)
  })

  it('shouldExec rejects requests missing a URL', () => {
    const api = buildProxyServerApi(baseOptions, telemetry)
    expect(api.shouldExec({ req: { method: 'GET' } as never, res: {} as never })).toBe(false)
  })

  it('does not attach onUpgrade unless websockets are explicitly enabled', () => {
    const apiWithoutWs = buildProxyServerApi(baseOptions, telemetry)
    const apiWithWs = buildProxyServerApi({ ...baseOptions, enableWebsockets: true }, telemetry)
    expect(apiWithoutWs.onUpgrade).toBeUndefined()
    expect(typeof apiWithWs.onUpgrade).toBe('function')
  })

  it('throws on an invalid targetBaseUrl', () => {
    expect(() => buildProxyServerApi({ ...baseOptions, targetBaseUrl: 'not-a-url' }, telemetry)).toThrow(
      /Invalid targetBaseUrl/,
    )
  })

  it('throws on non-HTTP(S) targets', () => {
    expect(() =>
      buildProxyServerApi({ ...baseOptions, targetBaseUrl: 'ftp://upstream.invalid:21' }, telemetry),
    ).toThrow(/protocol/i)
  })
})
