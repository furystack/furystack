import { createHash, createHmac, timingSafeEqual } from 'crypto'

export const base64UrlEncode = (data: string | Buffer): string => {
  const buf = typeof data === 'string' ? Buffer.from(data) : data
  return buf.toString('base64url')
}

export const base64UrlDecode = (data: string): string => Buffer.from(data, 'base64url').toString('utf8')

export type JwtHeader = {
  alg: string
  typ: string
}

export type JwtAccessTokenPayload = {
  sub: string
  roles: string[]
  iat: number
  exp: number
  iss?: string
  aud?: string
  /** SHA-256 hash of the fingerprint cookie value (OWASP token sidejacking prevention). */
  fpt?: string
}

/** Hashes a raw fingerprint value with SHA-256 for embedding in a JWT claim. */
export const hashFingerprint = (raw: string): string => createHash('sha256').update(raw).digest('hex')

export const signHs256 = (headerPayload: string, secret: string): string => {
  return createHmac('sha256', secret).update(headerPayload).digest('base64url')
}

export const verifyHs256 = (headerPayload: string, signature: string, secret: string): boolean => {
  const expected = createHmac('sha256', secret).update(headerPayload).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export const createJwt = (payload: JwtAccessTokenPayload, secret: string): string => {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const headerPayload = `${encodedHeader}.${encodedPayload}`
  const signature = signHs256(headerPayload, secret)
  return `${headerPayload}.${signature}`
}

export const decodeJwt = (
  token: string,
): { header: JwtHeader; payload: JwtAccessTokenPayload; headerPayload: string; signature: string } => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }
  const [headerB64, payloadB64, signature] = parts
  const header = JSON.parse(base64UrlDecode(headerB64)) as JwtHeader
  const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtAccessTokenPayload
  return { header, payload, headerPayload: `${headerB64}.${payloadB64}`, signature }
}
