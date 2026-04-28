import type { RestApi } from '@furystack/rest'
import type { ClientOptions } from '@furystack/rest-client-fetch'
import { createClient } from '@furystack/rest-client-fetch'

import type { JwtTokenStore } from './jwt-token-store.js'

export type JwtClientOptions = ClientOptions & {
  /** Shared token store that manages JWT state and refresh logic. */
  tokenStore: JwtTokenStore
}

/**
 * Creates a JWT-aware REST client that wraps `createClient` from `@furystack/rest-client-fetch`.
 *
 * Automatically injects the `Authorization: Bearer` header from the shared
 * {@link JwtTokenStore}, proactively refreshes expiring tokens before each
 * request, and retries once on 401.
 *
 * Sets `credentials: 'include'` by default so the browser sends HTTP-only
 * cookies (e.g. the fingerprint cookie for OWASP token sidejacking prevention).
 * Override via `requestInit.credentials` if needed.
 *
 * All token lifecycle operations (login, logout, setTokens) live on the
 * token store, not on this client.
 *
 * **Important:** HTTPS is strongly recommended. Bearer tokens transmitted over
 * plain HTTP are vulnerable to interception and replay attacks.
 *
 * @typeParam TApi The REST API type definition
 * @param options Options for the fetch client and the shared token store
 */
export const createJwtClient = <TApi extends RestApi>(options: JwtClientOptions) => {
  const { tokenStore } = options
  const innerClient = createClient<TApi>({
    ...options,
    requestInit: {
      credentials: 'include',
      ...options.requestInit,
    },
  })

  return {
    /**
     * Makes an authenticated API call. Automatically:
     * 1. Proactively refreshes the token if it is about to expire.
     * 2. Injects the `Authorization: Bearer` header.
     * 3. On 401, attempts one refresh + retry before propagating the error.
     */
    call: async <
      TMethod extends keyof TApi,
      TAction extends keyof TApi[TMethod],
      TOptions extends Parameters<ReturnType<typeof createClient<TApi>>>[0],
    >(
      callOptions: TOptions & { method: TMethod; action: TAction },
    ) => {
      await tokenStore.ensureValidToken()

      const makeRequest = () => {
        const accessToken = tokenStore.getAccessToken()
        const headersWithAuth = accessToken
          ? {
              ...(callOptions as unknown as { headers?: Record<string, string> }).headers,
              Authorization: `Bearer ${accessToken}`,
            }
          : (callOptions as unknown as { headers?: Record<string, string> }).headers

        const finalOptions: Parameters<typeof innerClient>[0] = {
          ...callOptions,
          ...(headersWithAuth ? { headers: headersWithAuth } : {}),
        }
        return innerClient(finalOptions)
      }

      try {
        return await makeRequest()
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response: Response }).response?.status === 401 &&
          tokenStore.getAccessToken()
        ) {
          try {
            await tokenStore.forceRefresh()
            return await makeRequest()
          } catch {
            throw error
          }
        }
        throw error
      }
    },
  }
}
