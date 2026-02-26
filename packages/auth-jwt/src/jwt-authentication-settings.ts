import type { StoreManager } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { RefreshToken } from './models/refresh-token.js'

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

  /** Returns the PhysicalStore for refresh tokens. */
  public getRefreshTokenStore = (sm: StoreManager) => sm.getStoreFor(RefreshToken, 'token')
}
