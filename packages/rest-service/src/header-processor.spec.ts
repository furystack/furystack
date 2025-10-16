import type { IncomingMessage } from 'http'
import { describe, expect, it } from 'vitest'
import { HeaderProcessor } from './header-processor.js'

describe('HeaderProcessor', () => {
  const processor = new HeaderProcessor()

  describe('filterHeaders', () => {
    it('should filter out hop-by-hop headers', () => {
      const headers = {
        'content-type': 'application/json',
        connection: 'keep-alive',
        'keep-alive': 'timeout=5',
        'x-custom-header': 'custom-value',
        'transfer-encoding': 'chunked',
      }

      const filtered = processor.filterHeaders(headers)

      expect(filtered['content-type']).toBe('application/json')
      expect(filtered['x-custom-header']).toBe('custom-value')
      expect(filtered.connection).toBeUndefined()
      expect(filtered['keep-alive']).toBeUndefined()
      expect(filtered['transfer-encoding']).toBeUndefined()
    })

    it('should preserve all non-hop-by-hop headers', () => {
      const headers = {
        'content-type': 'text/html',
        'content-length': '1234',
        authorization: 'Bearer token',
        'x-custom-header': 'value',
      }

      const filtered = processor.filterHeaders(headers)

      expect(filtered).toEqual(headers)
    })

    it('should handle empty headers object', () => {
      const filtered = processor.filterHeaders({})
      expect(filtered).toEqual({})
    })
  })

  describe('processCookies', () => {
    it('should parse cookies from request header', () => {
      const req = {
        headers: {
          cookie: 'sessionId=abc123; theme=dark; userId=456',
        },
      } as IncomingMessage

      const cookies = processor.processCookies(req)

      expect(cookies).toEqual(['sessionId=abc123', 'theme=dark', 'userId=456'])
    })

    it('should return empty array when no cookies present', () => {
      const req = {
        headers: {},
      } as IncomingMessage

      const cookies = processor.processCookies(req)

      expect(cookies).toEqual([])
    })

    it('should apply cookie transformer when provided', () => {
      const req = {
        headers: {
          cookie: 'oldCookie=value',
        },
      } as IncomingMessage

      const transformer = (cookies: string[]) => [...cookies, 'newCookie=newValue']
      const cookies = processor.processCookies(req, transformer)

      expect(cookies).toEqual(['oldCookie=value', 'newCookie=newValue'])
    })

    it('should trim cookie values', () => {
      const req = {
        headers: {
          cookie: ' cookie1=value1 ; cookie2=value2 ',
        },
      } as IncomingMessage

      const cookies = processor.processCookies(req)

      expect(cookies).toEqual(['cookie1=value1', 'cookie2=value2'])
    })
  })

  describe('buildForwardedHeaders', () => {
    it('should build X-Forwarded-* headers', () => {
      const req = {
        headers: {
          'user-agent': 'test-agent',
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')

      expect(headers.Host).toBe('target.com')
      expect(headers['User-Agent']).toBe('test-agent')
      expect(headers['X-Forwarded-For']).toBe('192.168.1.100')
      expect(headers['X-Forwarded-Host']).toBe('source.com')
      expect(headers['X-Forwarded-Proto']).toBe('http')
    })

    it('should chain X-Forwarded-For headers', () => {
      const req = {
        headers: {
          'x-forwarded-for': '10.0.0.1, 10.0.0.2',
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')

      expect(headers['X-Forwarded-For']).toBe('10.0.0.1, 10.0.0.2, 192.168.1.100')
    })

    it('should detect HTTPS from encrypted socket', () => {
      const req = {
        headers: {
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
          encrypted: true,
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')

      expect(headers['X-Forwarded-Proto']).toBe('https')
    })

    it('should use existing X-Forwarded-Proto if present', () => {
      const req = {
        headers: {
          'x-forwarded-proto': 'https',
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')

      expect(headers['X-Forwarded-Proto']).toBe('https')
    })

    it('should use default User-Agent when not provided', () => {
      const req = {
        headers: {
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')

      expect(headers['User-Agent']).toBe('FuryStack-Proxy/1.0')
    })
  })

  describe('convertHeadersToRecord', () => {
    it('should convert string headers', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record).toEqual(headers)
    })

    it('should convert number headers to strings', () => {
      const headers = {
        'content-length': 1234,
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record['content-length']).toBe('1234')
    })

    it('should join array headers with commas', () => {
      const headers = {
        'x-custom-header': ['value1', 'value2', 'value3'],
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record['x-custom-header']).toBe('value1, value2, value3')
    })

    it('should skip undefined headers', () => {
      const headers = {
        'defined-header': 'value',
        'undefined-header': undefined,
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record['defined-header']).toBe('value')
      expect(record['undefined-header']).toBeUndefined()
    })

    it('should exclude cookie header', () => {
      const headers = {
        'content-type': 'application/json',
        cookie: 'sessionId=abc123',
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record['content-type']).toBe('application/json')
      expect(record.cookie).toBeUndefined()
    })

    it('should exclude hop-by-hop headers', () => {
      const headers = {
        'content-type': 'application/json',
        connection: 'keep-alive',
        'transfer-encoding': 'chunked',
      }

      const record = processor.convertHeadersToRecord(headers)

      expect(record['content-type']).toBe('application/json')
      expect(record.connection).toBeUndefined()
      expect(record['transfer-encoding']).toBeUndefined()
    })
  })

  describe('processRequestHeaders', () => {
    it('should process all headers and return proxy-ready headers', () => {
      const req = {
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          cookie: 'sessionId=abc123',
          connection: 'keep-alive',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const result = processor.processRequestHeaders(req, 'target.com')

      expect(result.proxyHeaders['content-type']).toBe('application/json')
      expect(result.proxyHeaders.Host).toBe('target.com')
      expect(result.proxyHeaders['X-Forwarded-For']).toBe('192.168.1.100')
      expect(result.proxyHeaders.Cookie).toBe('sessionId=abc123')
      expect(result.proxyHeaders.connection).toBeUndefined()
      expect(result.finalCookies).toEqual(['sessionId=abc123'])
    })

    it('should apply header transformer', () => {
      const req = {
        headers: {
          'content-type': 'application/json',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headerTransformer = () => ({
        'x-custom-header': 'custom-value',
      })

      const result = processor.processRequestHeaders(req, 'target.com', {
        headers: headerTransformer,
      })

      expect(result.proxyHeaders['x-custom-header']).toBe('custom-value')
      expect(result.proxyHeaders['content-type']).toBeUndefined()
    })

    it('should apply cookie transformer', () => {
      const req = {
        headers: {
          cookie: 'oldCookie=value',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const cookieTransformer = (cookies: string[]) => [...cookies, 'newCookie=newValue']

      const result = processor.processRequestHeaders(req, 'target.com', {
        cookies: cookieTransformer,
      })

      expect(result.proxyHeaders.Cookie).toBe('oldCookie=value; newCookie=newValue')
      expect(result.finalCookies).toEqual(['oldCookie=value', 'newCookie=newValue'])
    })

    it('should not include Cookie header when no cookies present', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const result = processor.processRequestHeaders(req, 'target.com')

      expect(result.proxyHeaders.Cookie).toBeUndefined()
      expect(result.finalCookies).toEqual([])
    })
  })

  describe('isHopByHopHeader', () => {
    it('should identify hop-by-hop headers', () => {
      expect(processor.isHopByHopHeader('connection')).toBe(true)
      expect(processor.isHopByHopHeader('Connection')).toBe(true)
      expect(processor.isHopByHopHeader('keep-alive')).toBe(true)
      expect(processor.isHopByHopHeader('transfer-encoding')).toBe(true)
      expect(processor.isHopByHopHeader('upgrade')).toBe(true)
    })

    it('should not identify regular headers as hop-by-hop', () => {
      expect(processor.isHopByHopHeader('content-type')).toBe(false)
      expect(processor.isHopByHopHeader('authorization')).toBe(false)
      expect(processor.isHopByHopHeader('x-custom-header')).toBe(false)
    })

    it('should identify all standard hop-by-hop headers', () => {
      expect(processor.isHopByHopHeader('proxy-authenticate')).toBe(true)
      expect(processor.isHopByHopHeader('proxy-authorization')).toBe(true)
      expect(processor.isHopByHopHeader('te')).toBe(true)
      expect(processor.isHopByHopHeader('trailer')).toBe(true)
    })
  })

  describe('Edge cases and complex scenarios', () => {
    it('should handle empty cookie strings correctly', () => {
      const req = {
        headers: {
          cookie: '',
        },
      } as IncomingMessage

      const cookies = processor.processCookies(req)
      expect(cookies).toEqual([''])
    })

    it('should handle multiple semicolons in cookie string', () => {
      const req = {
        headers: {
          cookie: 'cookie1=value1;;cookie2=value2',
        },
      } as IncomingMessage

      const cookies = processor.processCookies(req)
      expect(cookies).toEqual(['cookie1=value1', '', 'cookie2=value2'])
    })

    it('should handle cookies with special characters', () => {
      const req = {
        headers: {
          cookie: 'session=abc%3D123; token=Bearer%20xyz',
        },
      } as IncomingMessage

      const cookies = processor.processCookies(req)
      expect(cookies).toEqual(['session=abc%3D123', 'token=Bearer%20xyz'])
    })

    it('should handle missing remote address gracefully', () => {
      const req = {
        headers: {
          host: 'source.com',
        },
        socket: {},
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')
      expect(headers['X-Forwarded-For']).toBe('')
    })

    it('should handle very long X-Forwarded-For chains', () => {
      const longChain = Array.from({ length: 20 }, (_, i) => `10.0.0.${i + 1}`).join(', ')
      const req = {
        headers: {
          'x-forwarded-for': longChain,
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')
      expect(headers['X-Forwarded-For']).toContain(longChain)
      expect(headers['X-Forwarded-For']).toContain('192.168.1.100')
    })

    it('should handle mixed case header names', () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value',
        CONNECTION: 'keep-alive',
      }

      const filtered = processor.filterHeaders(headers)
      expect(filtered['Content-Type']).toBe('application/json')
      expect(filtered['X-Custom-Header']).toBe('value')
      expect(filtered.CONNECTION).toBeUndefined()
    })

    it('should handle empty array headers', () => {
      const headers = {
        'X-Empty-Array': [],
      }

      const record = processor.convertHeadersToRecord(headers)
      expect(record['X-Empty-Array']).toBe('')
    })

    it('should preserve header order when processing', () => {
      const req = {
        headers: {
          'first-header': 'first',
          'second-header': 'second',
          'third-header': 'third',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const result = processor.processRequestHeaders(req, 'target.com')
      expect(result.proxyHeaders['first-header']).toBe('first')
      expect(result.proxyHeaders['second-header']).toBe('second')
      expect(result.proxyHeaders['third-header']).toBe('third')
    })

    it('should handle X-Forwarded-For with whitespace variations', () => {
      const req = {
        headers: {
          'x-forwarded-for': '10.0.0.1 , 10.0.0.2,  10.0.0.3',
          host: 'source.com',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const headers = processor.buildForwardedHeaders(req, 'target.com')
      expect(headers['X-Forwarded-For']).toBe('10.0.0.1, 10.0.0.2, 10.0.0.3, 192.168.1.100')
    })

    it('should handle cookie transformer returning empty array', () => {
      const req = {
        headers: {
          cookie: 'session=abc123',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const result = processor.processRequestHeaders(req, 'target.com', {
        cookies: () => [],
      })

      expect(result.proxyHeaders.Cookie).toBeUndefined()
      expect(result.finalCookies).toEqual([])
    })

    it('should handle header transformer removing all headers', () => {
      const req = {
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as unknown as IncomingMessage

      const result = processor.processRequestHeaders(req, 'target.com', {
        headers: () => ({}),
      })

      // Should still have forwarded headers
      expect(result.proxyHeaders.Host).toBe('target.com')
      expect(result.proxyHeaders['X-Forwarded-For']).toBeTruthy()
      // But not the original headers
      expect(result.proxyHeaders['content-type']).toBeUndefined()
      expect(result.proxyHeaders.authorization).toBeUndefined()
    })
  })
})
