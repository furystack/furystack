import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { signToken, verifyToken, MIN_SECRET_LENGTH } from './sign-token.js'

const SECRET = 'a'.repeat(MIN_SECRET_LENGTH)

describe('signToken / verifyToken', () => {
  it('round-trips a payload', () => {
    const payload = { k: 'a/b', o: 'download' as const, e: Math.floor(Date.now() / 1000) + 60, n: 'nonce' }
    const token = signToken(payload, SECRET)
    expect(verifyToken(token, SECRET)).toEqual(payload)
  })

  it('preserves optional fields (contentType, maxBytes)', () => {
    const payload = {
      k: 'upload/key',
      o: 'upload' as const,
      e: Math.floor(Date.now() / 1000) + 60,
      c: 'application/octet-stream',
      m: 1024,
      n: 'nonce',
    }
    const token = signToken(payload, SECRET)
    expect(verifyToken(token, SECRET)).toEqual(payload)
  })

  it('accepts Uint8Array secrets', () => {
    const secretBytes = new Uint8Array(MIN_SECRET_LENGTH).fill(0xab)
    const payload = { k: 'k', o: 'download' as const, e: Math.floor(Date.now() / 1000) + 60, n: 'n' }
    const token = signToken(payload, secretBytes)
    expect(verifyToken(token, secretBytes)).toEqual(payload)
  })

  it('rejects an empty token', () => {
    expect(() => verifyToken('', SECRET)).toThrow(/missing/)
  })

  it('rejects a malformed token (no dot)', () => {
    expect(() => verifyToken('no-dot-here', SECRET)).toThrow(/malformed/)
  })

  it('rejects a malformed token (trailing dot)', () => {
    expect(() => verifyToken('body.', SECRET)).toThrow(/malformed/)
  })

  it('rejects a token signed with a different secret', () => {
    const payload = { k: 'k', o: 'download' as const, e: Math.floor(Date.now() / 1000) + 60, n: 'n' }
    const token = signToken(payload, SECRET)
    expect(() => verifyToken(token, 'b'.repeat(MIN_SECRET_LENGTH))).toThrow(/mismatch/)
  })

  it('rejects a token whose body has been tampered with', () => {
    const payload = { k: 'k', o: 'download' as const, e: Math.floor(Date.now() / 1000) + 60, n: 'n' }
    const token = signToken(payload, SECRET)
    const [, sig] = token.split('.')
    const tampered = `bm90LWEtcGF5bG9hZA.${sig}`
    expect(() => verifyToken(tampered, SECRET)).toThrow(/mismatch/)
  })

  it('rejects a token whose signed body is not valid JSON', () => {
    const garbageBody = Buffer.from('not-json')
      .toString('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    const sig = createHmac('sha256', SECRET)
      .update(garbageBody)
      .digest('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    expect(() => verifyToken(`${garbageBody}.${sig}`, SECRET)).toThrow(/not valid JSON/)
  })

  it('rejects an expired token', () => {
    const payload = { k: 'k', o: 'download' as const, e: Math.floor(Date.now() / 1000) - 1, n: 'n' }
    const token = signToken(payload, SECRET)
    expect(() => verifyToken(token, SECRET)).toThrow(/expired/)
  })

  it('uses the supplied now() override', () => {
    const payload = { k: 'k', o: 'download' as const, e: 1000, n: 'n' }
    const token = signToken(payload, SECRET)
    expect(verifyToken(token, SECRET, () => 500_000)).toEqual(payload)
    expect(() => verifyToken(token, SECRET, () => 1_000_001)).toThrow(/expired/)
  })
})
