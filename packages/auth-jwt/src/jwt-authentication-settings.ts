import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { RefreshToken } from './models/refresh-token.js'

/**
 * Settings for the fingerprint cookie used to prevent token sidejacking (XSS token theft).
 *
 * When enabled, a random fingerprint is hashed and embedded in the JWT `fpt` claim,
 * while the raw value is sent as an HTTP-only cookie. On verification, the cookie
 * value is hashed and compared against the claim.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-sidejacking
 */
export type FingerprintCookieSettings = {
  /** Whether fingerprint cookie protection is enabled. Default: `true`. */
  enabled: boolean
  /** Cookie name. Default: `'fpt'`. Consider `'__Secure-fpt'` or `'__Host-fpt'` in production. */
  name: string
  /** SameSite attribute. Default: `'Strict'`. */
  sameSite: 'Strict' | 'Lax' | 'None'
  /** Whether the Secure flag is set (cookie only sent over HTTPS). Default: `true`. */
  secure: boolean
  /** Cookie path. Default: `'/'`. */
  path: string
}

const DEFAULT_FINGERPRINT_COOKIE_SETTINGS: FingerprintCookieSettings = {
  enabled: true,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
}

/**
 * Configuration for JWT Bearer token authentication.
 *
 * @important HTTPS is strongly recommended when using JWT Bearer tokens,
 * as tokens transmitted over plain HTTP are vulnerable to interception.
 */
@Injectable({ lifetime: 'singleton' })
export class JwtAuthenticationSettings {
  /**
   * HMAC secret for HS256 signing. Must be at least 32 bytes (256 bits) of entropy.
   * Validated at setup time by {@link useJwtAuthentication}.
   * @see https://datatracker.ietf.org/doc/html/rfc7518#section-3.2
   */
  public secret!: string

  /** Access token lifetime in seconds. Default: 900 (15 minutes). */
  public accessTokenExpirationSeconds = 900

  /** Refresh token lifetime in seconds. Default: 604800 (7 days). */
  public refreshTokenExpirationSeconds = 604800

  /**
   * Seconds of clock skew tolerance for exp validation. Default: 5.
   * Prevents spurious rejections in distributed deployments with minor clock drift.
   */
  public clockSkewToleranceSeconds = 5

  /**
   * Grace period in seconds during which a revoked refresh token is still accepted
   * (returns the same replacement token). Handles the network-loss race condition
   * where the client never receives the new token pair. Default: 30.
   */
  public refreshTokenRotationGracePeriodSeconds = 30

  /** JWT 'iss' claim. If set, tokens are signed with this issuer and verified against it. */
  public issuer?: string

  /** JWT 'aud' claim. If set, tokens are signed with this audience and verified against it. */
  public audience?: string

  /**
   * Fingerprint cookie settings for OWASP token sidejacking prevention.
   * Enabled by default. Set `enabled: false` to opt out (e.g. for non-browser clients).
   */
  public fingerprintCookie: FingerprintCookieSettings = { ...DEFAULT_FINGERPRINT_COOKIE_SETTINGS }

  /** Returns the DataSet for refresh tokens. */
  public getRefreshTokenDataSet = (injector: Injector) => getDataSetFor(injector, RefreshToken, 'token')
}
