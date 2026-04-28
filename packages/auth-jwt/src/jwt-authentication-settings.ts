import type { Injector } from '@furystack/inject'
import { defineService, type Token } from '@furystack/inject'
import type { useJwtAuthentication } from './helpers.js'

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

/**
 * Returns a fresh copy of the default fingerprint cookie settings.
 */
export const defaultFingerprintCookieSettings = (): FingerprintCookieSettings => ({
  enabled: true,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
})

/**
 * Configuration for JWT Bearer token authentication.
 *
 * **Important:** HTTPS is strongly recommended when using JWT Bearer tokens,
 * as tokens transmitted over plain HTTP are vulnerable to interception.
 */
export interface JwtAuthenticationSettings {
  /**
   * HMAC secret for HS256 signing. Must be at least 32 bytes (256 bits) of entropy.
   * Validated at setup time by {@link useJwtAuthentication}.
   * @see https://datatracker.ietf.org/doc/html/rfc7518#section-3.2
   */
  secret: string
  /** Access token lifetime in seconds. Default: 900 (15 minutes). */
  accessTokenExpirationSeconds: number
  /** Refresh token lifetime in seconds. Default: 604800 (7 days). */
  refreshTokenExpirationSeconds: number
  /**
   * Seconds of clock skew tolerance for exp validation. Default: 5.
   * Prevents spurious rejections in distributed deployments with minor clock drift.
   */
  clockSkewToleranceSeconds: number
  /**
   * Grace period in seconds during which a revoked refresh token is still accepted
   * (returns the same replacement token). Handles the network-loss race condition
   * where the client never receives the new token pair. Default: 30.
   */
  refreshTokenRotationGracePeriodSeconds: number
  /** JWT 'iss' claim. If set, tokens are signed with this issuer and verified against it. */
  issuer?: string
  /** JWT 'aud' claim. If set, tokens are signed with this audience and verified against it. */
  audience?: string
  /**
   * Fingerprint cookie settings for OWASP token sidejacking prevention.
   * Enabled by default. Set `enabled: false` to opt out (e.g. for non-browser clients).
   */
  fingerprintCookie: FingerprintCookieSettings
}

/**
 * Returns a fresh copy of the default {@link JwtAuthenticationSettings}
 * apart from `secret`, which must be supplied by the caller via
 * {@link useJwtAuthentication}. The default factory for the
 * {@link JwtAuthenticationSettings} token throws until rebound.
 */
export const defaultJwtAuthenticationSettings = (): Omit<JwtAuthenticationSettings, 'secret'> => ({
  accessTokenExpirationSeconds: 900,
  refreshTokenExpirationSeconds: 604800,
  clockSkewToleranceSeconds: 5,
  refreshTokenRotationGracePeriodSeconds: 30,
  fingerprintCookie: defaultFingerprintCookieSettings(),
})

/**
 * Error thrown by the default {@link JwtAuthenticationSettings} factory when
 * it is resolved without first calling {@link useJwtAuthentication}.
 */
export class JwtAuthenticationNotConfiguredError extends Error {
  constructor() {
    super(
      'JwtAuthenticationSettings has not been configured. Call useJwtAuthentication(injector, { secret, ... }) before resolving JwtTokenService or any JWT action.',
    )
    this.name = 'JwtAuthenticationNotConfiguredError'
  }
}

/**
 * DI token carrying the current {@link JwtAuthenticationSettings}. The default
 * factory throws — bind via {@link useJwtAuthentication} (preferred) or
 * directly through {@link Injector.bind} before resolving JWT services.
 */
export const JwtAuthenticationSettings: Token<JwtAuthenticationSettings, 'singleton'> = defineService({
  name: 'furystack/auth-jwt/JwtAuthenticationSettings',
  lifetime: 'singleton',
  factory: () => {
    throw new JwtAuthenticationNotConfiguredError()
  },
})
