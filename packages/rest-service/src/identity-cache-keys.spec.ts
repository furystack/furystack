import { describe, expect, it } from 'vitest'
import { sessionCacheKey, userCacheTag } from './identity-cache-keys.js'

describe('identity-cache-keys', () => {
  describe('sessionCacheKey', () => {
    it('prefixes the session id with `cookie:`', () => {
      expect(sessionCacheKey('abc')).toBe('cookie:abc')
    })

    it('preserves the empty string suffix shape', () => {
      expect(sessionCacheKey('')).toBe('cookie:')
    })
  })

  describe('userCacheTag', () => {
    it('prefixes the username with `user:`', () => {
      expect(userCacheTag('alice')).toBe('user:alice')
    })

    it('preserves the empty string suffix shape', () => {
      expect(userCacheTag('')).toBe('user:')
    })
  })
})
