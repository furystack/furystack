import type { RestApi } from '@furystack/rest'
import type { ClientOptions } from '@furystack/rest-client-fetch'
import { createClient } from '@furystack/rest-client-fetch'

export type JwtClientOptions = ClientOptions & {
  /** Refresh when token expires within this many seconds. Default: 60. */
  refreshThresholdSeconds?: number
  onTokenRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void
  onRefreshFailed?: (error: unknown) => void
}

type TokenPair = {
  accessToken: string
  refreshToken: string
}

const decodeTokenExp = (token: string): number | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'exp' in payload &&
      typeof (payload as { exp: unknown }).exp === 'number'
    ) {
      return (payload as { exp: number }).exp
    }
    return null
  } catch {
    return null
  }
}

/**
 * Creates a JWT-aware REST client that wraps `createClient` from `@furystack/rest-client-fetch`.
 *
 * Provides automatic Bearer header injection, proactive token refresh, and
 * refresh queuing to prevent thundering herd on concurrent requests.
 *
 * @important HTTPS is strongly recommended. Bearer tokens transmitted over
 * plain HTTP are vulnerable to interception and replay attacks.
 *
 * @typeParam TApi The REST API type definition
 * @param clientOptions Options for the underlying fetch client
 * @param loginEndpoint The API action path for JWT login (e.g. '/jwt/login')
 * @param refreshEndpoint The API action path for token refresh (e.g. '/jwt/refresh')
 * @param logoutEndpoint The API action path for JWT logout (e.g. '/jwt/logout')
 */
export const createJwtClient = <TApi extends RestApi>(
  clientOptions: JwtClientOptions,
  loginEndpoint: string,
  refreshEndpoint: string,
  logoutEndpoint?: string,
) => {
  const refreshThresholdSeconds = clientOptions.refreshThresholdSeconds ?? 60
  let tokens: TokenPair | null = null
  let refreshPromise: Promise<TokenPair> | null = null

  const innerClient = createClient<TApi>(clientOptions)

  const rawFetch = clientOptions.fetch || fetch

  const joinUrl = (base: string, path: string): string => {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
    if (!path) return normalizedBase
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${normalizedBase}${normalizedPath}`
  }

  const fetchJson = async <T>(url: string, body: unknown): Promise<T> => {
    const fullUrl = joinUrl(clientOptions.endpointUrl, url)
    const response = await rawFetch(fullUrl, {
      ...clientOptions.requestInit,
      method: 'POST',
      headers: {
        ...clientOptions.requestInit?.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return (await response.json()) as T
  }

  const isTokenExpiringSoon = (): boolean => {
    if (!tokens) return false
    const exp = decodeTokenExp(tokens.accessToken)
    if (exp === null) return true
    const now = Math.floor(Date.now() / 1000)
    return exp - now <= refreshThresholdSeconds
  }

  const refreshTokens = async (): Promise<TokenPair> => {
    if (!tokens) throw new Error('No tokens available for refresh')
    const newTokens = await fetchJson<TokenPair>(refreshEndpoint, {
      refreshToken: tokens.refreshToken,
    })
    tokens = newTokens
    clientOptions.onTokenRefreshed?.(newTokens)
    return newTokens
  }

  const ensureValidToken = async (): Promise<void> => {
    if (!tokens) return
    if (!isTokenExpiringSoon()) return

    if (refreshPromise) {
      await refreshPromise
      return
    }

    refreshPromise = refreshTokens()
      .catch((error) => {
        clientOptions.onRefreshFailed?.(error)
        tokens = null
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })

    await refreshPromise
  }

  return {
    /**
     * Authenticates with username/password and stores the returned tokens.
     */
    login: async (credentials: { username: string; password: string }): Promise<TokenPair> => {
      const result = await fetchJson<TokenPair>(loginEndpoint, credentials)
      tokens = result
      return result
    },

    /**
     * Revokes the refresh token (if a logout endpoint is configured) and clears in-memory tokens.
     */
    logout: async (): Promise<void> => {
      if (logoutEndpoint && tokens) {
        try {
          await fetchJson(logoutEndpoint, { refreshToken: tokens.refreshToken })
        } catch {
          // Best-effort; clear tokens regardless
        }
      }
      tokens = null
    },

    /**
     * Makes an authenticated API call. Automatically:
     * 1. Proactively refreshes the token if it's about to expire.
     * 2. Injects the `Authorization: Bearer` header.
     * 3. On 401, attempts one refresh + retry before propagating the error.
     */
    call: async <
      TMethod extends keyof TApi,
      TAction extends keyof TApi[TMethod],
      TOptions extends Parameters<ReturnType<typeof createClient<TApi>>>[0],
    >(
      options: TOptions & { method: TMethod; action: TAction },
    ) => {
      await ensureValidToken()

      const makeRequest = () => {
        const headersWithAuth = tokens
          ? {
              ...(options as unknown as { headers?: Record<string, string> }).headers,
              Authorization: `Bearer ${tokens.accessToken}`,
            }
          : (options as unknown as { headers?: Record<string, string> }).headers

        return innerClient({
          ...options,
          ...(headersWithAuth ? { headers: headersWithAuth } : {}),
        } as Parameters<typeof innerClient>[0])
      }

      try {
        return await makeRequest()
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response: Response }).response?.status === 401 &&
          tokens
        ) {
          try {
            await refreshTokens()
            return await makeRequest()
          } catch {
            tokens = null
            throw error
          }
        }
        throw error
      }
    },

    /** Returns the current access token, or null if not authenticated. */
    getAccessToken: (): string | null => tokens?.accessToken ?? null,

    /** Returns whether a non-expired access token is currently held. */
    get isAuthenticated(): boolean {
      if (!tokens) return false
      const exp = decodeTokenExp(tokens.accessToken)
      if (exp === null) return false
      return exp > Math.floor(Date.now() / 1000)
    },

    /** Sets tokens directly (e.g. restoring from persistent storage). */
    setTokens: (tokenPair: TokenPair): void => {
      tokens = tokenPair
    },
  }
}
