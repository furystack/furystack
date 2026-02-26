import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { UnauthenticatedError } from '@furystack/security'
import { randomBytes, timingSafeEqual } from 'crypto'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { createJwt, decodeJwt, hashFingerprint, verifyHs256 } from './jwt-utils.js'
import type { RefreshToken } from './models/refresh-token.js'

/**
 * Service for creating and verifying JWT access tokens and managing refresh tokens.
 *
 * Access tokens are stateless HS256-signed JWTs. Refresh tokens are high-entropy
 * opaque strings stored via a Repository DataSet for revocation support.
 *
 * **Known tradeoffs:**
 * - Roles baked into the access token remain valid until `exp` even if changed server-side.
 * - Access tokens cannot be revoked before expiry; keep `accessTokenExpirationSeconds` short.
 * - `sub` uses `username` (the User model primary key) which is assumed immutable.
 */
@Injectable({ lifetime: 'singleton' })
export class JwtTokenService {
  @Injected(JwtAuthenticationSettings)
  declare private readonly settings: JwtAuthenticationSettings

  @Injected((injector: Injector) => useSystemIdentityContext({ injector, username: 'JwtTokenService' }))
  declare private readonly systemInjector: Injector

  private getRefreshTokenDataSet = () => this.settings.getRefreshTokenDataSet(this.systemInjector)

  /**
   * Signs an access token JWT for the given user.
   *
   * When fingerprint cookie protection is enabled, a random fingerprint is generated,
   * its SHA-256 hash is embedded as the `fpt` claim, and the raw value is returned
   * so the caller can set it as an HTTP-only cookie.
   *
   * @param user The user to create a token for
   * @returns The signed JWT string and the raw fingerprint (or `null` if fingerprinting is disabled)
   */
  public signAccessToken(user: Pick<User, 'username' | 'roles'>): { token: string; fingerprint: string | null } {
    const now = Math.floor(Date.now() / 1000)

    const fingerprint = this.settings.fingerprintCookie.enabled ? randomBytes(32).toString('hex') : null

    const token = createJwt(
      {
        sub: user.username,
        roles: user.roles,
        iat: now,
        exp: now + this.settings.accessTokenExpirationSeconds,
        ...(this.settings.issuer ? { iss: this.settings.issuer } : {}),
        ...(this.settings.audience ? { aud: this.settings.audience } : {}),
        ...(fingerprint ? { fpt: hashFingerprint(fingerprint) } : {}),
      },
      this.settings.secret,
    )

    return { token, fingerprint }
  }

  /**
   * Verifies an access token and returns its payload.
   *
   * When fingerprint cookie protection is enabled, the caller must provide the raw
   * fingerprint value from the HTTP-only cookie. Its hash is compared against the
   * `fpt` claim in the token using timing-safe comparison.
   *
   * @param token The JWT string to verify
   * @param fingerprint The raw fingerprint cookie value (required when fingerprinting is enabled)
   * @returns The decoded payload
   * @throws UnauthenticatedError if the token is invalid, expired, has a wrong algorithm, or fingerprint mismatch
   */
  public verifyAccessToken(token: string, fingerprint?: string | null) {
    try {
      const { header, payload, headerPayload, signature } = decodeJwt(token)

      if (header.alg !== 'HS256') {
        throw new UnauthenticatedError()
      }

      if (!verifyHs256(headerPayload, signature, this.settings.secret)) {
        throw new UnauthenticatedError()
      }

      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now - this.settings.clockSkewToleranceSeconds) {
        throw new UnauthenticatedError()
      }

      if (this.settings.issuer && payload.iss !== this.settings.issuer) {
        throw new UnauthenticatedError()
      }

      if (this.settings.audience && payload.aud !== this.settings.audience) {
        throw new UnauthenticatedError()
      }

      if (this.settings.fingerprintCookie.enabled) {
        if (!payload.fpt || !fingerprint) {
          throw new UnauthenticatedError()
        }
        const expectedHash = payload.fpt
        const actualHash = hashFingerprint(fingerprint)
        const expected = Buffer.from(expectedHash, 'hex')
        const actual = Buffer.from(actualHash, 'hex')
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
          throw new UnauthenticatedError()
        }
      }

      return payload
    } catch (error) {
      if (error instanceof UnauthenticatedError) throw error
      throw new UnauthenticatedError()
    }
  }

  /**
   * Creates a high-entropy opaque refresh token and stores it.
   * @param user The user to create a refresh token for
   * @returns The refresh token string
   */
  public async signRefreshToken(user: Pick<User, 'username'>): Promise<string> {
    const token = randomBytes(32).toString('hex')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.settings.refreshTokenExpirationSeconds * 1000)

    await this.getRefreshTokenDataSet().add(this.systemInjector, {
      token,
      username: user.username,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    return token
  }

  /**
   * Verifies a refresh token against the store.
   * Handles the grace period for recently-rotated tokens.
   * @param token The refresh token string
   * @returns An object with the username, and optionally the replacement token if within grace period
   * @throws UnauthenticatedError if the token is not found, expired, or revoked beyond grace period
   */
  public async verifyRefreshToken(token: string): Promise<{ username: string; replacedByToken?: string }> {
    const dataSet = this.getRefreshTokenDataSet()
    const results = await dataSet.find(this.systemInjector, { filter: { token: { $eq: token } }, top: 2 })
    if (results.length !== 1) {
      throw new UnauthenticatedError()
    }

    const refreshToken = results[0]

    if (new Date(refreshToken.expiresAt) < new Date()) {
      throw new UnauthenticatedError()
    }

    if (refreshToken.revokedAt) {
      const revokedAt = new Date(refreshToken.revokedAt)
      const gracePeriodEnd = new Date(revokedAt.getTime() + this.settings.refreshTokenRotationGracePeriodSeconds * 1000)

      if (new Date() > gracePeriodEnd) {
        throw new UnauthenticatedError()
      }

      return { username: refreshToken.username, replacedByToken: refreshToken.replacedByToken }
    }

    return { username: refreshToken.username }
  }

  /**
   * Marks a refresh token as revoked, recording the replacement token.
   * The token remains in the store for the grace period.
   */
  public async rotateRefreshToken(oldToken: string, newToken: string): Promise<void> {
    const dataSet = this.getRefreshTokenDataSet()
    await dataSet.update(this.systemInjector, oldToken, {
      revokedAt: new Date().toISOString(),
      replacedByToken: newToken,
    } as Partial<RefreshToken>)
  }

  /**
   * Immediately removes a refresh token from the store (hard revocation, no grace period).
   */
  public async revokeRefreshToken(token: string): Promise<void> {
    const dataSet = this.getRefreshTokenDataSet()
    const results = await dataSet.find(this.systemInjector, { filter: { token: { $eq: token } }, top: 2 })
    if (results.length === 1) {
      await dataSet.remove(this.systemInjector, token)
    }
  }

  /**
   * Removes all refresh tokens for a user (e.g., "sign out all devices").
   */
  public async revokeAllRefreshTokensForUser(username: string): Promise<void> {
    const dataSet = this.getRefreshTokenDataSet()
    const tokens = await dataSet.find(this.systemInjector, { filter: { username: { $eq: username } } })
    if (tokens.length > 0) {
      await dataSet.remove(this.systemInjector, ...tokens.map((t) => t.token))
    }
  }
}
