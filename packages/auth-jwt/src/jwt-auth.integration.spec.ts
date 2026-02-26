import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import type { RestApi } from '@furystack/rest'
import { DefaultSession, GetCurrentUser, useHttpAuthentication, useRestService } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import { usePasswordPolicy } from '@furystack/security'
import { PathHelper, sleepAsync, usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { JwtLoginAction } from './actions/jwt-login-action.js'
import { JwtLogoutAction } from './actions/jwt-logout-action.js'
import { JwtRefreshAction } from './actions/jwt-refresh-action.js'
import { useJwtAuthentication } from './helpers.js'
import type { FingerprintCookieSettings } from './jwt-authentication-settings.js'
import { base64UrlEncode, createJwt } from './jwt-utils.js'
import { RefreshToken } from './models/refresh-token.js'

const SECRET = 'integration-test-secret-that-is-at-least-32-bytes-long!'

interface JwtIntegrationApi extends RestApi {
  GET: {
    '/currentUser': { result: User }
  }
  POST: {
    '/jwt/login': {
      result: { accessToken: string; refreshToken: string }
      body: { username: string; password: string }
    }
    '/jwt/refresh': { result: { accessToken: string; refreshToken: string }; body: { refreshToken: string } }
    '/jwt/logout': { result: unknown; body: { refreshToken: string } }
  }
}

const ACCESS_TOKEN_EXPIRATION_SECONDS = 2
const GRACE_PERIOD_SECONDS = 2
const FINGERPRINT_DISABLED: FingerprintCookieSettings = {
  enabled: false,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
}

const createJwtTestServer = async (fingerprintCookie: FingerprintCookieSettings = FINGERPRINT_DISABLED) => {
  const injector = new Injector()
  const port = getPort()
  const root = 'api'

  addStore(injector, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))

  const repo = getRepository(injector)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(RefreshToken, 'token')

  useHttpAuthentication(injector)
  usePasswordPolicy(injector)
  useJwtAuthentication(injector, {
    secret: SECRET,
    accessTokenExpirationSeconds: ACCESS_TOKEN_EXPIRATION_SECONDS,
    refreshTokenExpirationSeconds: 60,
    clockSkewToleranceSeconds: 0,
    refreshTokenRotationGracePeriodSeconds: GRACE_PERIOD_SECONDS,
    fingerprintCookie,
  })

  await useRestService<JwtIntegrationApi>({
    injector,
    root,
    port,
    api: {
      GET: {
        '/currentUser': GetCurrentUser,
      },
      POST: {
        '/jwt/login': JwtLoginAction,
        '/jwt/refresh': JwtRefreshAction,
        '/jwt/logout': JwtLogoutAction,
      },
    },
  })

  return {
    injector,
    apiUrl: `http://127.0.0.1:${port}/${root}`,
    port,
    [Symbol.asyncDispose]: injector[Symbol.asyncDispose].bind(injector),
  }
}

const seedUser = async (injector: Injector, username: string, password: string, roles: string[] = []) => {
  const sm = injector.getInstance(StoreManager)
  const pw = injector.getInstance(PasswordAuthenticator)
  const cred = await pw.hasher.createCredential(username, password)
  await sm.getStoreFor(PasswordCredential, 'userName').add(cred)
  await sm.getStoreFor(User, 'username').add({ username, roles })
}

type TokenPair = { accessToken: string; refreshToken: string }

const postJson = async (url: string, body: unknown, cookie?: string): Promise<Response> =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })

const login = async (
  apiUrl: string,
  username: string,
  password: string,
): Promise<{ response: Response } & TokenPair> => {
  const response = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/login'), { username, password })
  if (!response.ok) return { response, accessToken: '', refreshToken: '' }
  const tokens = (await response.json()) as TokenPair
  return { response, ...tokens }
}

const authGet = async (apiUrl: string, path: string, accessToken: string, cookie?: string): Promise<Response> =>
  fetch(PathHelper.joinPaths(apiUrl, path), {
    headers: { Authorization: `Bearer ${accessToken}`, ...(cookie ? { Cookie: cookie } : {}) },
  })

const extractSetCookieValue = (response: Response, cookieName: string): string | null => {
  const setCookie = response.headers.getSetCookie?.()
  if (!setCookie) return null
  for (const cookie of setCookie) {
    if (cookie.startsWith(`${cookieName}=`)) {
      const value = cookie.split(';')[0]?.split('=').slice(1).join('=')
      return value || null
    }
  }
  return null
}

describe('@furystack/auth-jwt integration tests', () => {
  describe('Happy path', () => {
    it('Should return tokens on successful login', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { response, accessToken, refreshToken } = await login(apiUrl, 'testuser', 'testpass')
        expect(response.status).toBe(200)
        expect(accessToken).toBeTruthy()
        expect(refreshToken).toBeTruthy()
        expect(accessToken.split('.')).toHaveLength(3)
      })
    })

    it('Should authenticate requests with a valid Bearer token', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass', ['admin'])
        const { accessToken } = await login(apiUrl, 'testuser', 'testpass')

        const response = await authGet(apiUrl, 'currentUser', accessToken)
        expect(response.status).toBe(200)
        const user = (await response.json()) as User
        expect(user.username).toBe('testuser')
        expect(user.roles).toEqual(['admin'])
      })
    })

    it('Should refresh tokens and return a new pair', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken: oldRefreshToken } = await login(apiUrl, 'testuser', 'testpass')

        const refreshResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: oldRefreshToken,
        })
        expect(refreshResponse.status).toBe(200)
        const newTokens = (await refreshResponse.json()) as TokenPair
        expect(newTokens.accessToken).toBeTruthy()
        expect(newTokens.refreshToken).toBeTruthy()
      })
    })

    it('Should accept the new access token after a refresh', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        const refreshResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), { refreshToken })
        const newTokens = (await refreshResponse.json()) as TokenPair

        const userResponse = await authGet(apiUrl, 'currentUser', newTokens.accessToken)
        expect(userResponse.status).toBe(200)
        const user = (await userResponse.json()) as User
        expect(user.username).toBe('testuser')
      })
    })

    it('Should revoke the refresh token on logout', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        const logoutResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/logout'), { refreshToken })
        expect(logoutResponse.status).toBe(200)

        const refreshResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), { refreshToken })
        expect(refreshResponse.status).toBe(401)
      })
    })
  })

  describe('Full session lifecycle', () => {
    it('Should support login -> auth -> refresh -> auth -> logout', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')

        // Login
        const { accessToken, refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        // Authenticated request
        const userResponse1 = await authGet(apiUrl, 'currentUser', accessToken)
        expect(userResponse1.status).toBe(200)

        // Refresh
        const refreshResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), { refreshToken })
        expect(refreshResponse.status).toBe(200)
        const newTokens = (await refreshResponse.json()) as TokenPair

        // Authenticated request with new token
        const userResponse2 = await authGet(apiUrl, 'currentUser', newTokens.accessToken)
        expect(userResponse2.status).toBe(200)

        // Logout
        const logoutResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/logout'), {
          refreshToken: newTokens.refreshToken,
        })
        expect(logoutResponse.status).toBe(200)

        // Refresh after logout fails
        const failedRefresh = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: newTokens.refreshToken,
        })
        expect(failedRefresh.status).toBe(401)
      })
    })
  })

  describe('Authentication failures', () => {
    it('Should return 401 without a Bearer token', async () => {
      await usingAsync(await createJwtTestServer(), async ({ apiUrl }) => {
        const response = await fetch(PathHelper.joinPaths(apiUrl, 'currentUser'))
        expect(response.status).toBe(401)
      })
    })

    it('Should return 401 with an invalid Bearer token', async () => {
      await usingAsync(await createJwtTestServer(), async ({ apiUrl }) => {
        const response = await authGet(apiUrl, 'currentUser', 'not-a-valid-token')
        expect(response.status).toBe(401)
      })
    })

    it('Should return 400 on login with wrong password', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { response } = await login(apiUrl, 'testuser', 'wrongpassword')
        expect(response.status).toBe(400)
      })
    })

    it('Should return 400 on login with nonexistent user', async () => {
      await usingAsync(await createJwtTestServer(), async ({ apiUrl }) => {
        const { response } = await login(apiUrl, 'nobody', 'nopass')
        expect(response.status).toBe(400)
      })
    })
  })

  describe('Token expiration', () => {
    it('Should return 401 when the access token has expired', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { accessToken } = await login(apiUrl, 'testuser', 'testpass')

        // Wait for the access token to expire (extra buffer for Math.floor rounding in verification)
        await sleepAsync((ACCESS_TOKEN_EXPIRATION_SECONDS + 1.5) * 1000)

        const response = await authGet(apiUrl, 'currentUser', accessToken)
        expect(response.status).toBe(401)
      })
    }, 10_000)

    it('Should still refresh successfully after access token expiry', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        await sleepAsync((ACCESS_TOKEN_EXPIRATION_SECONDS + 0.5) * 1000)

        const refreshResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), { refreshToken })
        expect(refreshResponse.status).toBe(200)
        const newTokens = (await refreshResponse.json()) as TokenPair
        expect(newTokens.accessToken).toBeTruthy()

        const userResponse = await authGet(apiUrl, 'currentUser', newTokens.accessToken)
        expect(userResponse.status).toBe(200)
      })
    }, 10_000)
  })

  describe('Invalid signature / tampered tokens', () => {
    it('Should reject a token with a tampered payload', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { accessToken } = await login(apiUrl, 'testuser', 'testpass')

        // Tamper with the payload: change the username
        const [header, , signature] = accessToken.split('.')
        const tamperedPayload = base64UrlEncode(
          JSON.stringify({ sub: 'hacker', roles: ['admin'], iat: 0, exp: Date.now() / 1000 + 9999 }),
        )
        const tamperedToken = `${header}.${tamperedPayload}.${signature}`

        const response = await authGet(apiUrl, 'currentUser', tamperedToken)
        expect(response.status).toBe(401)
      })
    })

    it('Should reject a token signed with a different secret', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')

        const now = Math.floor(Date.now() / 1000)
        const forgedToken = createJwt(
          { sub: 'testuser', roles: [], iat: now, exp: now + 900 },
          'a-completely-different-secret-that-is-long-enough!',
        )

        const response = await authGet(apiUrl, 'currentUser', forgedToken)
        expect(response.status).toBe(401)
      })
    })

    it('Should reject a token with alg: none', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')

        const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
        const now = Math.floor(Date.now() / 1000)
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900 }))
        const algNoneToken = `${header}.${payload}.`

        const response = await authGet(apiUrl, 'currentUser', algNoneToken)
        expect(response.status).toBe(401)
      })
    })
  })

  describe('Refresh token rotation grace period', () => {
    it('Should allow replaying the old refresh token within the grace period', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken: originalRefreshToken } = await login(apiUrl, 'testuser', 'testpass')

        // First refresh — rotates the token
        const firstRefresh = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: originalRefreshToken,
        })
        expect(firstRefresh.status).toBe(200)
        const firstTokens = (await firstRefresh.json()) as TokenPair

        // Replay the old refresh token within grace period
        const replayRefresh = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: originalRefreshToken,
        })
        expect(replayRefresh.status).toBe(200)
        const replayTokens = (await replayRefresh.json()) as TokenPair

        // Grace period replay should return the same replacement refresh token
        expect(replayTokens.refreshToken).toBe(firstTokens.refreshToken)
      })
    })

    it('Should reject the old refresh token after the grace period expires', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken: originalRefreshToken } = await login(apiUrl, 'testuser', 'testpass')

        // Refresh — rotates the token
        const firstRefresh = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: originalRefreshToken,
        })
        expect(firstRefresh.status).toBe(200)

        // Wait for the grace period to expire
        await sleepAsync((GRACE_PERIOD_SECONDS + 0.5) * 1000)

        const lateReplay = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: originalRefreshToken,
        })
        expect(lateReplay.status).toBe(401)
      })
    }, 10_000)
  })

  describe('Edge cases', () => {
    it('Should handle double logout gracefully', async () => {
      await usingAsync(await createJwtTestServer(), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        const logout1 = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/logout'), { refreshToken })
        expect(logout1.status).toBe(200)

        const logout2 = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/logout'), { refreshToken })
        expect(logout2.status).toBe(200)
      })
    })

    it('Should return 401 when refreshing with a nonexistent token', async () => {
      await usingAsync(await createJwtTestServer(), async ({ apiUrl }) => {
        const response = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/refresh'), {
          refreshToken: 'this-token-does-not-exist-in-the-store',
        })
        expect(response.status).toBe(401)
      })
    })
  })

  describe('Fingerprint cookie protection', () => {
    const FINGERPRINT_ENABLED: FingerprintCookieSettings = {
      enabled: true,
      name: 'fpt',
      sameSite: 'Strict',
      secure: false,
      path: '/',
    }

    it('Should set the fingerprint cookie on login', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { response } = await login(apiUrl, 'testuser', 'testpass')
        expect(response.status).toBe(200)
        const fptValue = extractSetCookieValue(response, 'fpt')
        expect(fptValue).toBeTruthy()
        expect(fptValue!.length).toBeGreaterThan(0)
      })
    })

    it('Should authenticate when sending the fingerprint cookie', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass', ['admin'])
        const { response, accessToken } = await login(apiUrl, 'testuser', 'testpass')
        const fptValue = extractSetCookieValue(response, 'fpt')

        const userResponse = await authGet(apiUrl, 'currentUser', accessToken, `fpt=${fptValue}`)
        expect(userResponse.status).toBe(200)
        const user = (await userResponse.json()) as User
        expect(user.username).toBe('testuser')
      })
    })

    it('Should reject requests without the fingerprint cookie', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { accessToken } = await login(apiUrl, 'testuser', 'testpass')

        const userResponse = await authGet(apiUrl, 'currentUser', accessToken)
        expect(userResponse.status).toBe(401)
      })
    })

    it('Should reject requests with a wrong fingerprint cookie', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { accessToken } = await login(apiUrl, 'testuser', 'testpass')

        const userResponse = await authGet(apiUrl, 'currentUser', accessToken, 'fpt=wrong-value')
        expect(userResponse.status).toBe(401)
      })
    })

    it('Should set a new fingerprint cookie on refresh', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { response: loginResponse, refreshToken } = await login(apiUrl, 'testuser', 'testpass')
        const loginFpt = extractSetCookieValue(loginResponse, 'fpt')

        const refreshResponse = await postJson(
          PathHelper.joinPaths(apiUrl, 'jwt/refresh'),
          { refreshToken },
          `fpt=${loginFpt}`,
        )
        expect(refreshResponse.status).toBe(200)
        const refreshFpt = extractSetCookieValue(refreshResponse, 'fpt')
        expect(refreshFpt).toBeTruthy()
        expect(refreshFpt).not.toBe(loginFpt)

        const newTokens = (await refreshResponse.json()) as TokenPair
        const userResponse = await authGet(apiUrl, 'currentUser', newTokens.accessToken, `fpt=${refreshFpt}`)
        expect(userResponse.status).toBe(200)
      })
    })

    it('Should clear the fingerprint cookie on logout', async () => {
      await usingAsync(await createJwtTestServer(FINGERPRINT_ENABLED), async ({ injector, apiUrl }) => {
        await seedUser(injector, 'testuser', 'testpass')
        const { refreshToken } = await login(apiUrl, 'testuser', 'testpass')

        const logoutResponse = await postJson(PathHelper.joinPaths(apiUrl, 'jwt/logout'), { refreshToken })
        expect(logoutResponse.status).toBe(200)
        const setCookieHeaders = logoutResponse.headers.getSetCookie?.() ?? []
        const clearCookie = setCookieHeaders.find((c: string) => c.startsWith('fpt='))
        expect(clearCookie).toContain('Max-Age=0')
      })
    })
  })
})
