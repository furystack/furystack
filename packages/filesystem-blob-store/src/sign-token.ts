import { createHmac, timingSafeEqual } from 'node:crypto'
import { BlobStoreError } from '@furystack/blob-store'

/**
 * Operation embedded in a signed token. Restricts a download URL to GET
 * and an upload URL to PUT so accidental method confusion fails verify.
 */
export type SignedTokenOperation = 'download' | 'upload'

/**
 * Payload encoded inside a signed URL token.
 */
export type SignedTokenPayload = {
  /** Blob key the token grants access to. */
  k: string
  /** Operation (`download` | `upload`). */
  o: SignedTokenOperation
  /** Expiry as Unix epoch seconds. */
  e: number
  /** Optional content-type pin (upload only). */
  c?: string
  /** Optional max byte cap (upload only). */
  m?: number
  /** Random nonce — defends against guessable URLs even with weak secrets. */
  n: string
}

/**
 * Encodes a `Uint8Array` as URL-safe base64 (RFC 4648 §5) without padding.
 */
const encodeBase64Url = (data: Uint8Array): string =>
  Buffer.from(data).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

/**
 * Decodes a URL-safe base64 string back to a `Uint8Array`.
 */
const decodeBase64Url = (input: string): Uint8Array => {
  const padding = (4 - (input.length % 4)) % 4
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat(padding)
  return new Uint8Array(Buffer.from(padded, 'base64'))
}

/**
 * Minimum HMAC secret length. Mirrors common JWT guidance (256 bits) and
 * is enforced at adapter construction so weak secrets cannot slip in.
 */
export const MIN_SECRET_LENGTH = 32

const TEXT_ENCODER = new TextEncoder()

/**
 * Signs `payload` with `secret` using HMAC-SHA256. Output is the
 * base64url-encoded `{payload}.{signature}` string usable directly in a URL
 * path segment.
 */
export const signToken = (payload: SignedTokenPayload, secret: string | Uint8Array): string => {
  const body = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(payload)))
  const signature = encodeBase64Url(createHmac('sha256', secret).update(body).digest())
  return `${body}.${signature}`
}

/**
 * Verifies and decodes a signed token. Throws {@link BlobStoreError}
 * `code: 'signature-invalid'` when the signature is missing, malformed,
 * mismatched, or expired.
 */
export const verifyToken = (
  token: string,
  secret: string | Uint8Array,
  now: () => number = Date.now,
): SignedTokenPayload => {
  if (typeof token !== 'string' || token.length === 0) {
    throw new BlobStoreError('signature-invalid', 'Signed token is missing')
  }
  const dotIndex = token.indexOf('.')
  if (dotIndex <= 0 || dotIndex === token.length - 1) {
    throw new BlobStoreError('signature-invalid', 'Signed token is malformed')
  }
  const body = token.slice(0, dotIndex)
  const provided = token.slice(dotIndex + 1)
  const expected = encodeBase64Url(createHmac('sha256', secret).update(body).digest())
  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
    throw new BlobStoreError('signature-invalid', 'Signed token signature mismatch')
  }
  let payload: SignedTokenPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(body))) as SignedTokenPayload
  } catch (cause) {
    throw new BlobStoreError('signature-invalid', 'Signed token payload is not valid JSON', { cause })
  }
  if (typeof payload.e !== 'number' || payload.e * 1000 <= now()) {
    throw new BlobStoreError('signature-invalid', 'Signed token has expired')
  }
  return payload
}
