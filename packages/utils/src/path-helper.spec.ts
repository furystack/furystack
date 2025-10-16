import { describe, expect, it } from 'vitest'
import { PathHelper } from './path-helper.js'

/**
 * Path Helper tests
 */
export const pathHelperTests = describe('PathHelper', () => {
  describe('#trimSlashes()', () => {
    it('should trim from the beginning of the segment', () => {
      expect(PathHelper.trimSlashes('/segment')).toBe('segment')
    })

    it('should trim multiple slashes from the beginning of the segment', () => {
      expect(PathHelper.trimSlashes('//////segment')).toBe('segment')
    })

    it('should trim from the end of the segment', () => {
      expect(PathHelper.trimSlashes('segment/')).toBe('segment')
    })

    it('should trim multiple slashes from the end of the segment', () => {
      expect(PathHelper.trimSlashes('segment///')).toBe('segment')
    })
  })

  describe('#joinPaths()', () => {
    it('should join with slashes', () => {
      const joined = PathHelper.joinPaths('path1', 'path2', 'path3')
      expect(joined).toBe('path1/path2/path3')
    })

    it('should remove slashes from the beginning of the segments', () => {
      const joined = PathHelper.joinPaths('path1', 'path2/', 'path3/')
      expect(joined).toBe('path1/path2/path3')
    })

    it('should remove slashes from the end of the segments', () => {
      const joined = PathHelper.joinPaths('/path1', '/path2', 'path3/')
      expect(joined).toBe('path1/path2/path3')
    })
  })

  describe('#isAncestorOf()', () => {
    it('should return true if content is ancestor', () => {
      expect(PathHelper.isAncestorOf('Root/Example', 'Root/Example/Content1')).toBe(true)
    })

    it('should return true if content is ancestor and ends with a slash', () => {
      expect(PathHelper.isAncestorOf('Root/Example/', 'Root/Example/Content1')).toBe(true)
    })

    it('should return false if content is not an ancestor', () => {
      expect(PathHelper.isAncestorOf('Root/Example/', 'Root/Example2/Content1')).toBe(false)
    })
  })

  describe('#getSegments()', () => {
    it('Should split the path to segments', () => {
      expect(PathHelper.getSegments("Root/Example/('Content1')")).toEqual(['Root', 'Example', "('Content1')"])
    })
  })

  describe('#getParentPath()', () => {
    it('Should return the parent path', () => {
      expect(PathHelper.getParentPath('Root/Example/Content')).toBe('Root/Example')
    })

    it('Should return the path in case of 1 segments', () => {
      expect(PathHelper.getParentPath('Root')).toBe('Root')
    })
  })

  describe('#normalize()', () => {
    it('Should normalize the path', () => {
      expect(PathHelper.normalize('Root/Example/Content')).toBe('Root/Example/Content')
      expect(PathHelper.normalize('/Root/Example/Content')).toBe('Root/Example/Content')
      expect(PathHelper.normalize('Root/Example/Content/')).toBe('Root/Example/Content')
      expect(PathHelper.normalize('/Root/Example/Content/')).toBe('Root/Example/Content')
    })
  })

  describe('#trimTrailingSlash()', () => {
    it('should remove trailing slash', () => {
      expect(PathHelper.trimTrailingSlash('/api/')).toBe('/api')
    })

    it('should handle URLs with trailing slash', () => {
      expect(PathHelper.trimTrailingSlash('http://example.com/')).toBe('http://example.com')
    })

    it('should not modify paths without trailing slash', () => {
      expect(PathHelper.trimTrailingSlash('/api')).toBe('/api')
    })

    it('should handle empty string', () => {
      expect(PathHelper.trimTrailingSlash('')).toBe('')
    })

    it('should handle root path', () => {
      expect(PathHelper.trimTrailingSlash('/')).toBe('')
    })
  })

  describe('#trimLeadingSlash()', () => {
    it('should remove leading slash', () => {
      expect(PathHelper.trimLeadingSlash('/api')).toBe('api')
    })

    it('should not modify paths without leading slash', () => {
      expect(PathHelper.trimLeadingSlash('api')).toBe('api')
    })

    it('should handle empty string', () => {
      expect(PathHelper.trimLeadingSlash('')).toBe('')
    })

    it('should handle root path', () => {
      expect(PathHelper.trimLeadingSlash('/')).toBe('')
    })
  })

  describe('#ensureLeadingSlash()', () => {
    it('should add leading slash when missing', () => {
      expect(PathHelper.ensureLeadingSlash('api')).toBe('/api')
    })

    it('should not add extra slash when already present', () => {
      expect(PathHelper.ensureLeadingSlash('/api')).toBe('/api')
    })

    it('should handle empty string', () => {
      expect(PathHelper.ensureLeadingSlash('')).toBe('/')
    })
  })

  describe('#normalizeBaseUrl()', () => {
    it('should remove trailing slash from URL', () => {
      expect(PathHelper.normalizeBaseUrl('http://example.com/')).toBe('http://example.com')
    })

    it('should remove trailing slash from path', () => {
      expect(PathHelper.normalizeBaseUrl('/api/')).toBe('/api')
    })

    it('should not modify URL without trailing slash', () => {
      expect(PathHelper.normalizeBaseUrl('/api')).toBe('/api')
    })

    it('should handle HTTPS URLs', () => {
      expect(PathHelper.normalizeBaseUrl('https://example.com/')).toBe('https://example.com')
    })
  })

  describe('#joinUrl()', () => {
    it('should join URL with path (both with slashes)', () => {
      expect(PathHelper.joinUrl('http://example.com/', '/path')).toBe('http://example.com/path')
    })

    it('should join URL with path (URL with slash)', () => {
      expect(PathHelper.joinUrl('http://example.com/', 'path')).toBe('http://example.com/path')
    })

    it('should join URL with path (path with slash)', () => {
      expect(PathHelper.joinUrl('http://example.com', '/path')).toBe('http://example.com/path')
    })

    it('should join URL with path (neither with slash)', () => {
      expect(PathHelper.joinUrl('http://example.com', 'path')).toBe('http://example.com/path')
    })

    it('should join relative paths', () => {
      expect(PathHelper.joinUrl('/api', '/users')).toBe('/api/users')
      expect(PathHelper.joinUrl('/api/', 'users')).toBe('/api/users')
    })

    it('should handle empty path', () => {
      expect(PathHelper.joinUrl('http://example.com', '')).toBe('http://example.com')
      expect(PathHelper.joinUrl('http://example.com/', '')).toBe('http://example.com')
    })

    it('should handle complex paths', () => {
      expect(PathHelper.joinUrl('http://example.com:8080', '/api/v1/users')).toBe(
        'http://example.com:8080/api/v1/users',
      )
    })

    it('should preserve HTTPS protocol', () => {
      expect(PathHelper.joinUrl('https://secure.example.com', '/secure/path')).toBe(
        'https://secure.example.com/secure/path',
      )
    })
  })

  describe('#matchesBaseUrl()', () => {
    it('should match exact URL', () => {
      expect(PathHelper.matchesBaseUrl('/api', '/api')).toBe(true)
    })

    it('should match URL with trailing slash in base', () => {
      expect(PathHelper.matchesBaseUrl('/api', '/api/')).toBe(true)
    })

    it('should match URL starting with base', () => {
      expect(PathHelper.matchesBaseUrl('/api/users', '/api')).toBe(true)
    })

    it('should not match different URL', () => {
      expect(PathHelper.matchesBaseUrl('/other', '/api')).toBe(false)
    })

    it('should not match similar prefix without slash', () => {
      expect(PathHelper.matchesBaseUrl('/api2', '/api')).toBe(false)
      expect(PathHelper.matchesBaseUrl('/api-v2', '/api')).toBe(false)
    })

    it('should match nested paths', () => {
      expect(PathHelper.matchesBaseUrl('/api/v1/users/123', '/api')).toBe(true)
      expect(PathHelper.matchesBaseUrl('/api/v1/users/123', '/api/v1')).toBe(true)
    })

    it('should handle root path', () => {
      expect(PathHelper.matchesBaseUrl('/api', '/')).toBe(true)
      expect(PathHelper.matchesBaseUrl('/', '/')).toBe(true)
    })

    it('should match with query string', () => {
      expect(PathHelper.matchesBaseUrl('/api/users?page=1', '/api')).toBe(true)
    })

    it('should match with trailing slash in request', () => {
      expect(PathHelper.matchesBaseUrl('/api/', '/api')).toBe(true)
    })
  })

  describe('#extractPath()', () => {
    it('should extract path after base URL', () => {
      expect(PathHelper.extractPath('/api/users', '/api')).toBe('/users')
    })

    it('should return empty string for exact match', () => {
      expect(PathHelper.extractPath('/api', '/api')).toBe('')
    })

    it('should preserve query string', () => {
      expect(PathHelper.extractPath('/api/users?id=1', '/api')).toBe('/users?id=1')
    })

    it('should handle trailing slash in request', () => {
      expect(PathHelper.extractPath('/api/', '/api')).toBe('/')
    })

    it('should handle trailing slash in base', () => {
      expect(PathHelper.extractPath('/api/users', '/api/')).toBe('/users')
    })

    it('should extract nested paths', () => {
      expect(PathHelper.extractPath('/api/v1/users/123', '/api')).toBe('/v1/users/123')
      expect(PathHelper.extractPath('/api/v1/users/123', '/api/v1')).toBe('/users/123')
    })

    it('should return original URL if no match', () => {
      expect(PathHelper.extractPath('/other/path', '/api')).toBe('/other/path')
    })

    it('should handle complex query strings', () => {
      expect(PathHelper.extractPath('/api/search?q=test&limit=10&offset=0', '/api')).toBe(
        '/search?q=test&limit=10&offset=0',
      )
    })

    it('should preserve fragments', () => {
      expect(PathHelper.extractPath('/api/page#section', '/api')).toBe('/page#section')
    })
  })

  describe('#normalizeUrl()', () => {
    it('should remove double slashes from path', () => {
      expect(PathHelper.normalizeUrl('/api//users')).toBe('/api/users')
    })

    it('should remove multiple consecutive slashes', () => {
      expect(PathHelper.normalizeUrl('/api///users////123')).toBe('/api/users/123')
    })

    it('should preserve protocol slashes', () => {
      expect(PathHelper.normalizeUrl('http://example.com//path')).toBe('http://example.com/path')
    })

    it('should handle HTTPS protocol', () => {
      expect(PathHelper.normalizeUrl('https://example.com///path//to///resource')).toBe(
        'https://example.com/path/to/resource',
      )
    })

    it('should not modify already normalized URLs', () => {
      expect(PathHelper.normalizeUrl('http://example.com/path')).toBe('http://example.com/path')
      expect(PathHelper.normalizeUrl('/api/users')).toBe('/api/users')
    })

    it('should handle trailing slash', () => {
      expect(PathHelper.normalizeUrl('http://example.com/')).toBe('http://example.com/')
      expect(PathHelper.normalizeUrl('/api/')).toBe('/api/')
    })

    it('should handle custom protocols', () => {
      expect(PathHelper.normalizeUrl('ftp://example.com//path')).toBe('ftp://example.com/path')
      expect(PathHelper.normalizeUrl('ws://example.com//socket')).toBe('ws://example.com/socket')
    })

    it('should handle URLs with port', () => {
      expect(PathHelper.normalizeUrl('http://example.com:8080//path')).toBe('http://example.com:8080/path')
    })

    it('should preserve query strings', () => {
      expect(PathHelper.normalizeUrl('/api//users?page=1')).toBe('/api/users?page=1')
    })
  })
})
