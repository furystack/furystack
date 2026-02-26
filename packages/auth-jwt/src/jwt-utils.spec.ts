import { describe, expect, it } from 'vitest'
import {
  base64UrlDecode,
  base64UrlEncode,
  createJwt,
  decodeJwt,
  hashFingerprint,
  signHs256,
  verifyHs256,
} from './jwt-utils.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'

describe('JWT Utils', () => {
  describe('base64UrlEncode / base64UrlDecode', () => {
    it('Should round-trip a string', () => {
      const original = '{"alg":"HS256","typ":"JWT"}'
      expect(base64UrlDecode(base64UrlEncode(original))).toBe(original)
    })

    it('Should produce URL-safe output (no +, /, =)', () => {
      const encoded = base64UrlEncode('test data with special chars: +/=')
      expect(encoded).not.toMatch(/[+/=]/)
    })
  })

  describe('signHs256 / verifyHs256', () => {
    it('Should verify a valid signature', () => {
      const data = 'header.payload'
      const sig = signHs256(data, SECRET)
      expect(verifyHs256(data, sig, SECRET)).toBe(true)
    })

    it('Should reject a tampered signature', () => {
      const data = 'header.payload'
      const sig = signHs256(data, SECRET)
      const tampered = sig.slice(0, -1) + (sig.at(-1) === 'a' ? 'b' : 'a')
      expect(verifyHs256(data, tampered, SECRET)).toBe(false)
    })

    it('Should reject a signature from a different secret', () => {
      const data = 'header.payload'
      const sig = signHs256(data, 'wrong-secret-that-is-at-least-32-bytes!')
      expect(verifyHs256(data, sig, SECRET)).toBe(false)
    })
  })

  describe('createJwt / decodeJwt', () => {
    it('Should create and decode a valid JWT', () => {
      const payload = {
        sub: 'testuser',
        roles: ['admin'],
        iat: 1000,
        exp: 2000,
      }
      const token = createJwt(payload, SECRET)
      const decoded = decodeJwt(token)
      expect(decoded.header.alg).toBe('HS256')
      expect(decoded.header.typ).toBe('JWT')
      expect(decoded.payload.sub).toBe('testuser')
      expect(decoded.payload.roles).toEqual(['admin'])
      expect(decoded.payload.iat).toBe(1000)
      expect(decoded.payload.exp).toBe(2000)
    })

    it('Should throw on invalid JWT format (not 3 segments)', () => {
      expect(() => decodeJwt('only.two')).toThrow('Invalid JWT format')
      expect(() => decodeJwt('one')).toThrow('Invalid JWT format')
      expect(() => decodeJwt('a.b.c.d')).toThrow('Invalid JWT format')
    })
  })

  describe('hashFingerprint', () => {
    it('Should return a hex-encoded SHA-256 hash', () => {
      const hash = hashFingerprint('test-fingerprint')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('Should return deterministic output', () => {
      expect(hashFingerprint('same-input')).toBe(hashFingerprint('same-input'))
    })

    it('Should return different hashes for different inputs', () => {
      expect(hashFingerprint('input-a')).not.toBe(hashFingerprint('input-b'))
    })
  })
})
