import type { User } from '@furystack/core'
import type { IncomingMessage } from 'http'

/**
 * Interface for pluggable authentication providers.
 *
 * Each provider attempts to authenticate an HTTP request using
 * a specific mechanism (e.g. Basic Auth, Cookie, JWT Bearer).
 *
 * **Error handling contract:**
 * - Returns `User` if authentication succeeded.
 * - Returns `null` if this provider does not apply to the request
 *   (e.g. no relevant header present). The next provider in the chain will be tried.
 * - Throws if the provider applies but authentication fails due to
 *   bad credentials or an infrastructure error (DB down, etc.).
 *   Throwing skips remaining providers and results in a 401/500.
 */
export type AuthenticationProvider = {
  /**
   * Identifies the provider for debugging and logging purposes only.
   * Not used for deduplication or lookup.
   */
  readonly name: string
  authenticate: (request: Pick<IncomingMessage, 'headers'>) => Promise<User | null>
}
