import { describe, expect, it } from 'vitest'
import { JsonResult } from './request-action-implementation.js'
import { compileApi, shouldExecRequest, type RestApiImplementation } from './rest-api-runtime.js'

type SampleApi = {
  GET: {
    '/items': { result: { items: number[] } }
    '/items/:id': { url: { id: string }; result: { id: string } }
  }
  POST: {
    '/items': { body: { name: string }; result: { name: string } }
  }
}

const buildImplementation = (): RestApiImplementation<SampleApi> => ({
  GET: {
    '/items': async () => JsonResult({ items: [1, 2, 3] }),
    '/items/:id': async ({ getUrlParams }) => JsonResult({ id: (getUrlParams() as { id: string }).id }),
  },
  POST: {
    '/items': async ({ getBody }) => JsonResult(await getBody()),
  },
})

describe('rest-api-runtime', () => {
  describe('compileApi', () => {
    it('normalises paths, prefixes the root, and preserves method→route ordering', () => {
      const compiled = compileApi<SampleApi>(buildImplementation(), '/api')
      expect(Object.keys(compiled)).toEqual(['GET', 'POST'])
      const getRoutes = compiled.GET!
      expect(getRoutes).toHaveLength(2)
      expect(getRoutes[0].method).toBe('GET')
      expect(getRoutes[0].fullPath).toBe('/api/items')
      expect(getRoutes[1].fullPath).toBe('/api/items/:id')
    })

    it('produces matchers that extract url params', () => {
      const compiled = compileApi<SampleApi>(buildImplementation(), '/api')
      const itemById = compiled.GET!.find((r) => r.fullPath === '/api/items/:id')!
      const result = itemById.matcher('/api/items/42')
      expect(result && result.params).toEqual({ id: '42' })
    })

    it('returns false from matchers when the path does not match', () => {
      const compiled = compileApi<SampleApi>(buildImplementation(), '/api')
      const itemByIdMatcher = compiled.GET!.find((r) => r.fullPath === '/api/items/:id')!.matcher
      expect(itemByIdMatcher('/api/items')).toBe(false)
      expect(itemByIdMatcher('/other')).toBe(false)
    })
  })

  describe('shouldExecRequest', () => {
    const supportedMethods = ['GET', 'POST'] as string[]
    const rootApiPath = '/api'

    it('accepts supported methods whose URL starts with the root api path', () => {
      expect(shouldExecRequest({ method: 'GET', url: '/api/items', rootApiPath, supportedMethods })).toBe(true)
    })

    it('accepts OPTIONS (preflight) even when it is not explicitly in supportedMethods', () => {
      expect(shouldExecRequest({ method: 'OPTIONS', url: '/api/items', rootApiPath, supportedMethods })).toBe(true)
    })

    it('rejects unsupported methods', () => {
      expect(shouldExecRequest({ method: 'DELETE', url: '/api/items', rootApiPath, supportedMethods })).toBe(false)
    })

    it('rejects URLs that do not match the root api path', () => {
      expect(shouldExecRequest({ method: 'GET', url: '/other/items', rootApiPath, supportedMethods })).toBe(false)
    })

    it('rejects requests missing method or url', () => {
      expect(shouldExecRequest({ method: undefined, url: '/api/items', rootApiPath, supportedMethods })).toBe(false)
      expect(shouldExecRequest({ method: 'GET', url: undefined, rootApiPath, supportedMethods })).toBe(false)
    })
  })
})
