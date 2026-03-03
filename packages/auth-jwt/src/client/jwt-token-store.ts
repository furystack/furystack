import { EventHub, type ListenerErrorPayload } from '@furystack/utils'

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

/**
 * Events emitted by the JWT token store created via {@link createJwtTokenStore}
 */
export type JwtTokenStoreEvents = {
  onAccessTokenChanged: string | null
  onRefreshTokenChanged: string | null
  onRefreshFailed: { error: unknown }
  onListenerError: ListenerErrorPayload
}

export type JwtTokenStoreOptions = {
  /** Performs the login request. Returns the initial token pair. */
  login: (credentials: { username: string; password: string }) => Promise<TokenPair>
  /** Exchanges the current refresh token for a new token pair. */
  refresh: (refreshToken: string) => Promise<TokenPair>
  /** Revokes the refresh token on the server. Best-effort; tokens are cleared regardless of outcome. */
  logout?: (refreshToken: string) => Promise<void>
  /** Refresh when the access token expires within this many seconds. Default: 60. */
  refreshThresholdSeconds?: number
  /**
   * Called whenever the access token changes (including to `null` on logout or refresh failure).
   * @deprecated Use `subscribe('onAccessTokenChanged', ...)` on the returned store instead.
   */
  onAccessTokenChanged?: (accessToken: string | null) => void
  /**
   * Called whenever the refresh token changes (including to `null` on logout or refresh failure).
   * @deprecated Use `subscribe('onRefreshTokenChanged', ...)` on the returned store instead.
   */
  onRefreshTokenChanged?: (refreshToken: string | null) => void
  /**
   * Called when a token refresh attempt fails.
   * @deprecated Use `subscribe('onRefreshFailed', ...)` on the returned store instead.
   */
  onRefreshFailed?: (error: unknown) => void
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
 * Creates a shared JWT token store that manages token state, proactive refresh,
 * and refresh-promise queuing independently of any REST client.
 *
 * The store does not perform HTTP calls itself. Instead, the consumer provides
 * async callbacks (`login`, `refresh`, `logout`) that handle the actual network
 * requests. This allows multiple API clients to share a single token store.
 *
 * Token change and refresh failure events are emitted via EventHub. Use
 * `subscribe('onAccessTokenChanged', ...)` etc. to observe them. The legacy
 * option callbacks are still supported for backward compatibility.
 *
 * @param options Configuration including operation callbacks and change listeners
 */
export const createJwtTokenStore = (options: JwtTokenStoreOptions) => {
  const hub = new EventHub<JwtTokenStoreEvents>()

  if (options.onAccessTokenChanged) {
    hub.addListener('onAccessTokenChanged', options.onAccessTokenChanged)
  }
  if (options.onRefreshTokenChanged) {
    hub.addListener('onRefreshTokenChanged', options.onRefreshTokenChanged)
  }
  if (options.onRefreshFailed) {
    hub.addListener('onRefreshFailed', ({ error }) => options.onRefreshFailed!(error))
  }

  const refreshThresholdSeconds = options.refreshThresholdSeconds ?? 60
  let tokens: TokenPair | null = null
  let refreshPromise: Promise<TokenPair> | null = null

  const setTokensInternal = (newTokens: TokenPair | null, previousTokens: TokenPair | null) => {
    tokens = newTokens
    if (newTokens?.accessToken !== previousTokens?.accessToken) {
      hub.emit('onAccessTokenChanged', newTokens?.accessToken ?? null)
    }
    if (newTokens?.refreshToken !== previousTokens?.refreshToken) {
      hub.emit('onRefreshTokenChanged', newTokens?.refreshToken ?? null)
    }
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
    const previousTokens = tokens
    const newTokens = await options.refresh(tokens.refreshToken)
    setTokensInternal(newTokens, previousTokens)
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
        hub.emit('onRefreshFailed', { error })
        const previousTokens = tokens
        setTokensInternal(null, previousTokens)
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })

    await refreshPromise
  }

  return {
    /**
     * Authenticates with username/password, stores the returned tokens,
     * and fires change callbacks.
     */
    login: async (credentials: { username: string; password: string }): Promise<TokenPair> => {
      const previousTokens = tokens
      const result = await options.login(credentials)
      setTokensInternal(result, previousTokens)
      return result
    },

    /**
     * Revokes the refresh token (if a logout callback is configured) and
     * clears in-memory tokens. Fires change callbacks with `null`.
     */
    logout: async (): Promise<void> => {
      const previousTokens = tokens
      if (options.logout && previousTokens) {
        try {
          await options.logout(previousTokens.refreshToken)
        } catch {
          // Best-effort; clear tokens regardless
        }
      }
      setTokensInternal(null, previousTokens)
    },

    /**
     * Sets tokens directly (e.g. restoring from persistent storage).
     * Fires change callbacks for any tokens that differ from the current values.
     */
    setTokens: (tokenPair: TokenPair): void => {
      const previousTokens = tokens
      setTokensInternal(tokenPair, previousTokens)
    },

    /** Returns the current access token, or `null` if not authenticated. */
    getAccessToken: (): string | null => tokens?.accessToken ?? null,

    /** Returns whether a non-expired access token is currently held. */
    get isAuthenticated(): boolean {
      if (!tokens) return false
      const exp = decodeTokenExp(tokens.accessToken)
      if (exp === null) return false
      return exp > Math.floor(Date.now() / 1000)
    },

    /**
     * Ensures the current access token is valid. If it is about to expire,
     * triggers a refresh. Concurrent callers share the same refresh promise
     * to prevent thundering herd.
     */
    ensureValidToken,

    /**
     * Forces a token refresh regardless of expiry. Use when the server rejects
     * a token (e.g. 401) that hasn't technically expired yet (revocation,
     * fingerprint mismatch, etc.). Concurrent callers share the same refresh
     * promise.
     */
    forceRefresh: async (): Promise<void> => {
      if (!tokens) return

      if (refreshPromise) {
        await refreshPromise
        return
      }

      refreshPromise = refreshTokens()
        .catch((error) => {
          hub.emit('onRefreshFailed', { error })
          const previousTokens = tokens
          setTokensInternal(null, previousTokens)
          throw error
        })
        .finally(() => {
          refreshPromise = null
        })

      await refreshPromise
    },

    /** Subscribe to token store events */
    subscribe: hub.subscribe.bind(hub),
    /** Add a listener for token store events */
    addListener: hub.addListener.bind(hub),
    /** Remove a listener for token store events */
    removeListener: hub.removeListener.bind(hub),

    /** Disposes the internal EventHub, removing all listeners */
    [Symbol.dispose]: () => hub[Symbol.dispose](),
  }
}

/** The return type of {@link createJwtTokenStore}. */
export type JwtTokenStore = ReturnType<typeof createJwtTokenStore>
