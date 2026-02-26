import type { User } from '@furystack/core'
import { UnauthenticatedError } from '@furystack/security'
import type { DefaultSession } from '../models/default-session.js'
import type { AuthenticationProvider } from './authentication-provider.js'
import { extractSessionIdFromCookies } from './helpers.js'

/**
 * Creates an authentication provider for cookie-based session authentication.
 * @param cookieName The name of the session cookie
 * @param getSessionById Callback to find a session by ID
 * @param getUserByName Callback to find a user by username
 */
export const createCookieAuthProvider = (
  cookieName: string,
  getSessionById: (sessionId: string) => Promise<DefaultSession | null>,
  getUserByName: (username: string) => Promise<User>,
): AuthenticationProvider => ({
  name: 'cookie-auth',
  authenticate: async (request) => {
    const sessionId = extractSessionIdFromCookies(request, cookieName)
    if (!sessionId) return null
    const session = await getSessionById(sessionId)
    if (!session) throw new UnauthenticatedError()
    return await getUserByName(session.username)
  },
})
