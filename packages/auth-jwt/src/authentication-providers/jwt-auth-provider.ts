import type { PhysicalStore, User } from '@furystack/core'
import type { AuthenticationProvider } from '@furystack/rest-service'
import { UnauthenticatedError } from '@furystack/security'
import type { JwtTokenService } from '../jwt-token-service.js'

/**
 * Creates an authentication provider for JWT Bearer tokens.
 * Returns `null` if no Bearer header is present (passes to next provider).
 * Throws `UnauthenticatedError` if the Bearer token is invalid.
 */
export const createJwtAuthProvider = ({
  jwtTokenService,
  userStore,
}: {
  jwtTokenService: JwtTokenService
  userStore: PhysicalStore<User, 'username'>
}): AuthenticationProvider => ({
  name: 'jwt-bearer',
  authenticate: async (request) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    const payload = jwtTokenService.verifyAccessToken(token)
    const users = await userStore.find({ filter: { username: { $eq: payload.sub } }, top: 2 })
    if (users.length !== 1) throw new UnauthenticatedError()
    return users[0]
  },
})
