import { describe, expect, it } from 'vitest'
import { compileRoute } from './compile-route.js'

describe('compile-route', () => {
  describe('compileRoute', () => {
    it('should compile route with string params', () => {
      const result = compileRoute('/users/:id', { id: 'abc123' })
      expect(result).toBe('/users/abc123')
    })

    it('should compile route with numeric params (stringified)', () => {
      const result = compileRoute('/users/:id', { id: 42 })
      expect(result).toBe('/users/42')
    })

    it('should compile route with multiple params', () => {
      const result = compileRoute('/users/:userId/posts/:postId', {
        userId: 'user1',
        postId: 'post2',
      })
      expect(result).toBe('/users/user1/posts/post2')
    })

    it('should handle empty params object for static routes', () => {
      const result = compileRoute('/home', {})
      expect(result).toBe('/home')
    })

    it('should handle params with special characters', () => {
      const result = compileRoute('/search/:query', { query: 'hello-world' })
      expect(result).toBe('/search/hello-world')
    })

    it('should handle boolean params (stringified)', () => {
      const result = compileRoute('/feature/:enabled', { enabled: true })
      expect(result).toBe('/feature/true')
    })
  })
})
