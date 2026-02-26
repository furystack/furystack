import type { User } from '@furystack/core'
import type { AuthenticationProvider } from './authentication-provider.js'

/**
 * Creates an authentication provider for HTTP Basic Authentication.
 * @param authenticateUser Callback that verifies credentials and returns a User or throws
 */
export const createBasicAuthProvider = (
  authenticateUser: (username: string, password: string) => Promise<User>,
): AuthenticationProvider => ({
  name: 'basic-auth',
  authenticate: async (request) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Basic ')) return null
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
    const colonIndex = decoded.indexOf(':')
    const userName = decoded.slice(0, colonIndex)
    const password = decoded.slice(colonIndex + 1)
    return await authenticateUser(userName, password)
  },
})
