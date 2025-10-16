import { describe, expect, it } from 'vitest'
import { PathProcessor } from './path-processor.js'

describe('PathProcessor', () => {
  const processor = new PathProcessor()

  describe('validateUrl', () => {
    it('should validate and return a valid URL', () => {
      const url = processor.validateUrl('http://example.com/path')
      expect(url).toBeInstanceOf(URL)
      expect(url.href).toBe('http://example.com/path')
    })

    it('should throw error for invalid URL', () => {
      expect(() => processor.validateUrl('not-a-valid-url')).toThrow('Invalid URL')
    })

    it('should include context in error message', () => {
      expect(() => processor.validateUrl('invalid', 'targetBaseUrl')).toThrow('Invalid targetBaseUrl')
    })

    it('should validate HTTPS URLs', () => {
      const url = processor.validateUrl('https://secure.example.com')
      expect(url.protocol).toBe('https:')
    })

    it('should validate URLs with query strings', () => {
      const url = processor.validateUrl('http://example.com/path?foo=bar')
      expect(url.search).toBe('?foo=bar')
    })
  })

  describe('validateHttpProtocol', () => {
    it('should accept HTTP protocol', () => {
      const url = new URL('http://example.com')
      expect(() => processor.validateHttpProtocol(url)).not.toThrow()
    })

    it('should accept HTTPS protocol', () => {
      const url = new URL('https://example.com')
      expect(() => processor.validateHttpProtocol(url)).not.toThrow()
    })

    it('should reject FTP protocol', () => {
      const url = new URL('ftp://example.com')
      expect(() => processor.validateHttpProtocol(url)).toThrow('Invalid targetBaseUrl protocol: ftp:')
    })

    it('should reject WS protocol', () => {
      const url = new URL('ws://example.com')
      expect(() => processor.validateHttpProtocol(url)).toThrow('Invalid targetBaseUrl protocol: ws:')
    })

    it('should reject file protocol', () => {
      const url = new URL('file:///path/to/file')
      expect(() => processor.validateHttpProtocol(url)).toThrow('Invalid targetBaseUrl protocol: file:')
    })
  })

  describe('extractSourcePath', () => {
    it('should extract path after source base URL', () => {
      const path = processor.extractSourcePath('/api/users/123', '/api')
      expect(path).toBe('/users/123')
    })

    it('should extract empty path when URL matches exactly', () => {
      const path = processor.extractSourcePath('/api', '/api')
      expect(path).toBe('')
    })

    it('should preserve query strings', () => {
      const path = processor.extractSourcePath('/api/users?page=1&limit=10', '/api')
      expect(path).toBe('/users?page=1&limit=10')
    })

    it('should handle source base URL with trailing slash', () => {
      const path = processor.extractSourcePath('/api/users/123', '/api/')
      expect(path).toBe('users/123')
    })
  })

  describe('applyPathRewrite', () => {
    it('should return path as-is when no rewrite function provided', () => {
      const path = processor.applyPathRewrite('/users/123')
      expect(path).toBe('/users/123')
    })

    it('should apply rewrite function when provided', () => {
      const rewrite = (path: string) => path.replace('/old', '/new')
      const path = processor.applyPathRewrite('/old/path', rewrite)
      expect(path).toBe('/new/path')
    })

    it('should handle complex rewrite logic', () => {
      const rewrite = (path: string) => {
        // Remove version prefix
        return path.replace(/^\/v\d+/, '')
      }
      const path = processor.applyPathRewrite('/v1/users/123', rewrite)
      expect(path).toBe('/users/123')
    })

    it('should allow complete path transformation', () => {
      const rewrite = () => '/completely/different/path'
      const path = processor.applyPathRewrite('/original', rewrite)
      expect(path).toBe('/completely/different/path')
    })
  })

  describe('buildTargetUrl', () => {
    it('should combine base URL and path', () => {
      const url = processor.buildTargetUrl('http://example.com', '/api/users')
      expect(url).toBe('http://example.com/api/users')
    })

    it('should handle base URL with trailing slash', () => {
      const url = processor.buildTargetUrl('http://example.com/', '/api/users')
      expect(url).toBe('http://example.com//api/users')
    })

    it('should preserve query strings in path', () => {
      const url = processor.buildTargetUrl('http://example.com', '/api/users?page=1')
      expect(url).toBe('http://example.com/api/users?page=1')
    })

    it('should handle empty path', () => {
      const url = processor.buildTargetUrl('http://example.com', '')
      expect(url).toBe('http://example.com')
    })
  })

  describe('processUrl', () => {
    it('should process complete URL transformation', () => {
      const url = processor.processUrl('/api/users/123', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/users/123')
    })

    it('should apply path rewrite during processing', () => {
      const rewrite = (path: string) => path.replace('/old', '/new')
      const url = processor.processUrl('/api/old/path', '/api', 'http://target.com', rewrite)
      expect(url).toBe('http://target.com/new/path')
    })

    it('should preserve query strings', () => {
      const url = processor.processUrl('/api/users?page=1&limit=10', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/users?page=1&limit=10')
    })

    it('should throw error for invalid resulting URL', () => {
      // Use a base URL that when combined with the rewritten path will be invalid
      const rewrite = () => '://invalid-path'
      expect(() => processor.processUrl('/api/test', '/api', 'http:', rewrite)).toThrow('Invalid')
    })

    it('should handle complex source URLs', () => {
      const url = processor.processUrl(
        '/proxy/v1/api/users/123?sort=name&order=asc',
        '/proxy',
        'http://backend.example.com:8080',
      )
      expect(url).toBe('http://backend.example.com:8080/v1/api/users/123?sort=name&order=asc')
    })

    it('should work with HTTPS target URLs', () => {
      const url = processor.processUrl('/api/secure', '/api', 'https://secure.example.com')
      expect(url).toBe('https://secure.example.com/secure')
    })

    it('should handle exact URL matches', () => {
      const url = processor.processUrl('/api', '/api', 'http://target.com')
      expect(url).toBe('http://target.com')
    })

    it('should validate the resulting target URL', () => {
      // This should not throw because the result is valid
      expect(() => processor.processUrl('/api/test', '/api', 'http://target.com')).not.toThrow()
    })
  })

  describe('Edge cases and complex scenarios', () => {
    it('should handle very long URLs', () => {
      const longPath = `/api${'/segment'.repeat(100)}`
      const url = processor.processUrl(longPath, '/api', 'http://target.com')
      expect(url).toContain('target.com')
      expect(url).toContain('/segment')
    })

    it('should handle URLs with special characters in path', () => {
      const url = processor.processUrl('/api/path%20with%20spaces', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/path%20with%20spaces')
    })

    it('should handle URLs with encoded special characters', () => {
      const url = processor.processUrl('/api/user%2Fname', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/user%2Fname')
    })

    it('should handle URLs with hash fragments', () => {
      const url = processor.processUrl('/api/resource#section', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/resource#section')
    })

    it('should handle multiple query parameters', () => {
      const url = processor.processUrl('/api/search?q=test&sort=date&order=desc&page=1', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/search?q=test&sort=date&order=desc&page=1')
    })

    it('should handle empty query parameter values', () => {
      const url = processor.processUrl('/api/test?empty=&another=value', '/api', 'http://target.com')
      expect(url).toBe('http://target.com/test?empty=&another=value')
    })

    it('should handle source base URL ending with slash and path starting with slash', () => {
      const path = processor.extractSourcePath('/api//users', '/api/')
      expect(path).toBe('/users')
    })

    it('should handle double slashes in paths', () => {
      const url = processor.buildTargetUrl('http://target.com', '//path//to//resource')
      expect(url).toBe('http://target.com//path//to//resource')
    })

    it('should handle target URLs with ports', () => {
      const url = processor.processUrl('/api/test', '/api', 'http://target.com:8080')
      expect(url).toBe('http://target.com:8080/test')
    })

    it('should handle target URLs with paths', () => {
      const url = processor.processUrl('/api/test', '/api', 'http://target.com/base')
      expect(url).toBe('http://target.com/base/test')
    })

    it('should validate URL with only protocol', () => {
      expect(() => processor.validateUrl('http://')).toThrow('Invalid URL')
    })

    it('should handle path rewrite that adds query parameters', () => {
      const rewrite = (path: string) => `${path}?added=param`
      const url = processor.processUrl('/api/test?existing=value', '/api', 'http://target.com', rewrite)
      expect(url).toBe('http://target.com/test?existing=value?added=param')
    })

    it('should handle path rewrite that removes path completely', () => {
      const rewrite = () => ''
      const url = processor.processUrl('/api/test', '/api', 'http://target.com', rewrite)
      expect(url).toBe('http://target.com')
    })

    it('should handle path rewrite that adds leading slash', () => {
      const rewrite = (path: string) => `/${path}`
      const url = processor.processUrl('/api/test', '/api', 'http://target.com', rewrite)
      expect(url).toBe('http://target.com//test')
    })

    it('should validate HTTPS URLs with authentication', () => {
      const url = processor.validateUrl('https://user:pass@example.com/path')
      expect(url.protocol).toBe('https:')
      expect(url.username).toBe('user')
      expect(url.password).toBe('pass')
    })

    it('should handle URLs with international domain names', () => {
      const url = processor.validateUrl('http://例え.jp/path')
      expect(url.hostname).toBeTruthy()
    })

    it('should handle target URLs with trailing slash and path without leading slash', () => {
      const url = processor.buildTargetUrl('http://target.com/', 'path')
      expect(url).toBe('http://target.com/path')
    })

    it('should extract path with multiple slashes in source base URL', () => {
      const path = processor.extractSourcePath('/api//users', '/api')
      expect(path).toBe('//users')
    })

    it('should handle complex path rewrite with regex', () => {
      const rewrite = (path: string) => path.replace(/\/v\d+\//, '/')
      const url = processor.processUrl('/api/v2/users', '/api', 'http://target.com', rewrite)
      expect(url).toBe('http://target.com/users')
    })

    it('should validate data URLs are rejected', () => {
      expect(() => processor.validateHttpProtocol(new URL('data:text/plain,hello'))).toThrow(
        'Invalid targetBaseUrl protocol',
      )
    })

    it('should validate mailto URLs are rejected', () => {
      expect(() => processor.validateHttpProtocol(new URL('mailto:test@example.com'))).toThrow(
        'Invalid targetBaseUrl protocol',
      )
    })

    it('should handle IPv4 addresses in URLs', () => {
      const url = processor.validateUrl('http://192.168.1.1:8080/path')
      expect(url.hostname).toBe('192.168.1.1')
      expect(url.port).toBe('8080')
    })

    it('should handle IPv6 addresses in URLs', () => {
      const url = processor.validateUrl('http://[::1]:8080/path')
      expect(url.hostname).toBe('[::1]')
      expect(url.port).toBe('8080')
    })

    it('should handle localhost in URLs', () => {
      const url = processor.validateUrl('http://localhost:3000/api')
      expect(url.hostname).toBe('localhost')
      expect(url.port).toBe('3000')
    })
  })
})
