import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { AuthenticationProvider } from '@furystack/rest-service'
import { UnauthenticatedError } from '@furystack/security'

import { extractFingerprintCookie } from '../fingerprint-cookie.js'
import type { JwtTokenService } from '../jwt-token-service.js'

/**
 * Creates an authentication provider for JWT Bearer tokens.
 * Returns `null` if no Bearer header is present (passes to next provider).
 * Throws `UnauthenticatedError` if the Bearer token is invalid.
 *
 * @param options.fingerprintCookieName When non-null, the provider extracts the fingerprint
 *   from the named cookie and passes it to token verification for OWASP sidejacking prevention.
 */
export const createJwtAuthProvider = ({
  jwtTokenService,
  userDataSet,
  injector,
  fingerprintCookieName = null,
}: {
  jwtTokenService: JwtTokenService
  userDataSet: DataSet<User, 'username'>
  injector: Injector
  fingerprintCookieName?: string | null
}): AuthenticationProvider => ({
  name: 'jwt-bearer',
  authenticate: async (request) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    const fingerprint = fingerprintCookieName ? extractFingerprintCookie(request, fingerprintCookieName) : null
    const payload = jwtTokenService.verifyAccessToken(token, fingerprint)
    const users = await userDataSet.find(injector, { filter: { username: { $eq: payload.sub } }, top: 2 })
    if (users.length !== 1) throw new UnauthenticatedError()
    return users[0]
  },
})
