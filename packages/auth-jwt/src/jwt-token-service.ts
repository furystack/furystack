import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { UnauthenticatedError } from '@furystack/security'
import { randomBytes, timingSafeEqual } from 'crypto'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { createJwt, decodeJwt, hashFingerprint, verifyHs256 } from './jwt-utils.js'
import { RefreshTokenDataSet } from './refresh-token-store.js'

/**
 * Service for creating and verifying JWT access tokens and managing refresh tokens.
 *
 * Access tokens are stateless HS256-signed JWTs. Refresh tokens are high-entropy
 * opaque strings stored via the {@link RefreshTokenDataSet} for revocation support.
 *
 * **Known tradeoffs:**
 * - Roles baked into the access token remain valid until `exp` even if changed server-side.
 * - Access tokens cannot be revoked before expiry; keep `accessTokenExpirationSeconds` short.
 * - `sub` uses `username` (the User model primary key) which is assumed immutable.
 */
export interface JwtTokenService {
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
  signAccessToken(user: Pick<User, 'username' | 'roles'>): { token: string; fingerprint: string | null }
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
  verifyAccessToken(token: string, fingerprint?: string | null): ReturnType<typeof decodeJwt>['payload']
  /**
   * Creates a high-entropy opaque refresh token and stores it.
   * @param user The user to create a refresh token for
   * @returns The refresh token string
   */
  signRefreshToken(user: Pick<User, 'username'>): Promise<string>
  /**
   * Verifies a refresh token against the store.
   * Handles the grace period for recently-rotated tokens.
   * @throws UnauthenticatedError if the token is not found, expired, or revoked beyond grace period
   */
  verifyRefreshToken(token: string): Promise<{ username: string; replacedByToken?: string }>
  /**
   * Marks a refresh token as revoked, recording the replacement token.
   * The token remains in the store for the grace period.
   */
  rotateRefreshToken(oldToken: string, newToken: string): Promise<void>
  /**
   * Immediately removes a refresh token from the store (hard revocation, no grace period).
   */
  revokeRefreshToken(token: string): Promise<void>
  /**
   * Removes all refresh tokens for a user (e.g., "sign out all devices").
   */
  revokeAllRefreshTokensForUser(username: string): Promise<void>
}

/**
 * DI token for the singleton {@link JwtTokenService}.
 *
 * The factory resolves {@link JwtAuthenticationSettings} and
 * {@link RefreshTokenDataSet} up front, creates a system-identity child scope
 * for refresh-token I/O and registers `onDispose` teardown for that scope.
 */
export const JwtTokenService: Token<JwtTokenService, 'singleton'> = defineService({
  name: 'furystack/auth-jwt/JwtTokenService',
  lifetime: 'singleton',
  factory: ({ inject, injector, onDispose }): JwtTokenService => {
    const settings = inject(JwtAuthenticationSettings)
    const refreshTokenDataSet = inject(RefreshTokenDataSet)
    const systemInjector = useSystemIdentityContext({ injector, username: 'JwtTokenService' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    const signAccessToken = (user: Pick<User, 'username' | 'roles'>): { token: string; fingerprint: string | null } => {
      const now = Math.floor(Date.now() / 1000)

      const fingerprint = settings.fingerprintCookie.enabled ? randomBytes(32).toString('hex') : null

      const token = createJwt(
        {
          sub: user.username,
          roles: user.roles,
          iat: now,
          exp: now + settings.accessTokenExpirationSeconds,
          ...(settings.issuer ? { iss: settings.issuer } : {}),
          ...(settings.audience ? { aud: settings.audience } : {}),
          ...(fingerprint ? { fpt: hashFingerprint(fingerprint) } : {}),
        },
        settings.secret,
      )

      return { token, fingerprint }
    }

    const verifyAccessToken: JwtTokenService['verifyAccessToken'] = (token, fingerprint) => {
      try {
        const { header, payload, headerPayload, signature } = decodeJwt(token)

        if (header.alg !== 'HS256') {
          throw new UnauthenticatedError()
        }

        if (!verifyHs256(headerPayload, signature, settings.secret)) {
          throw new UnauthenticatedError()
        }

        const now = Math.floor(Date.now() / 1000)
        if (payload.exp < now - settings.clockSkewToleranceSeconds) {
          throw new UnauthenticatedError()
        }

        if (settings.issuer && payload.iss !== settings.issuer) {
          throw new UnauthenticatedError()
        }

        if (settings.audience && payload.aud !== settings.audience) {
          throw new UnauthenticatedError()
        }

        if (settings.fingerprintCookie.enabled) {
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

    const signRefreshToken = async (user: Pick<User, 'username'>): Promise<string> => {
      const token = randomBytes(32).toString('hex')
      const now = new Date()
      const expiresAt = new Date(now.getTime() + settings.refreshTokenExpirationSeconds * 1000)

      await refreshTokenDataSet.add(systemInjector, {
        token,
        username: user.username,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      return token
    }

    const verifyRefreshToken = async (token: string): Promise<{ username: string; replacedByToken?: string }> => {
      const results = await refreshTokenDataSet.find(systemInjector, {
        filter: { token: { $eq: token } },
        top: 2,
      })
      if (results.length !== 1) {
        throw new UnauthenticatedError()
      }

      const refreshToken = results[0]

      if (new Date(refreshToken.expiresAt) < new Date()) {
        throw new UnauthenticatedError()
      }

      if (refreshToken.revokedAt) {
        const revokedAt = new Date(refreshToken.revokedAt)
        const gracePeriodEnd = new Date(revokedAt.getTime() + settings.refreshTokenRotationGracePeriodSeconds * 1000)

        if (new Date() > gracePeriodEnd) {
          throw new UnauthenticatedError()
        }

        return { username: refreshToken.username, replacedByToken: refreshToken.replacedByToken }
      }

      return { username: refreshToken.username }
    }

    const rotateRefreshToken = async (oldToken: string, newToken: string): Promise<void> => {
      await refreshTokenDataSet.update(systemInjector, oldToken, {
        revokedAt: new Date().toISOString(),
        replacedByToken: newToken,
      })
    }

    const revokeRefreshToken = async (token: string): Promise<void> => {
      const results = await refreshTokenDataSet.find(systemInjector, {
        filter: { token: { $eq: token } },
        top: 2,
      })
      if (results.length === 1) {
        await refreshTokenDataSet.remove(systemInjector, token)
      }
    }

    const revokeAllRefreshTokensForUser = async (username: string): Promise<void> => {
      const tokens = await refreshTokenDataSet.find(systemInjector, {
        filter: { username: { $eq: username } },
      })
      if (tokens.length > 0) {
        await refreshTokenDataSet.remove(systemInjector, ...tokens.map((t) => t.token))
      }
    }

    return {
      signAccessToken,
      verifyAccessToken,
      signRefreshToken,
      verifyRefreshToken,
      rotateRefreshToken,
      revokeRefreshToken,
      revokeAllRefreshTokensForUser,
    }
  },
})
