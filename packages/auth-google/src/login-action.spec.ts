import type { User } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import type { LoginResponseStrategy } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TokenPayload } from 'google-auth-library'
import { describe, expect, it, vi } from 'vitest'

import { createGoogleLoginAction } from './login-action.js'
import { GoogleLoginService } from './login-service.js'

const mockPayload: TokenPayload = {
  iss: 'accounts.google.com',
  sub: '123',
  aud: 'test',
  exp: 0,
  iat: 0,
  email: 'user@example.com',
  email_verified: true,
} as TokenPayload

const createMockService = (user: User | undefined, enableCsrfCheck = false): GoogleLoginService => ({
  clientId: 'test',
  enableCsrfCheck,
  getGoogleUserData: vi.fn(async () => mockPayload),
  getUserFromGooglePayload: vi.fn(async () => user),
})

describe('createGoogleLoginAction', () => {
  const request = { url: 'https://google.com', headers: {} } as IncomingMessage
  const response = {} as ServerResponse

  it('Should delegate to the strategy after resolving the user', async () => {
    await usingAsync(createInjector(), async (i) => {
      const testUser: User = { username: 'example', roles: [] }
      const strategyFn = vi.fn(async (user: User) => JsonResult(user, 200))
      const strategy: LoginResponseStrategy<User> = { createLoginResponse: strategyFn }

      i.bind(GoogleLoginService, () => createMockService(testUser))

      const action = createGoogleLoginAction(strategy)
      const result = await action({
        request,
        response,
        injector: i,
        getBody: () => Promise.resolve({ token: 'google-id-token' }),
      })

      expect(strategyFn).toHaveBeenCalledWith(testUser, i)
      expect(result.chunk.username).toBe('example')
    })
  })

  it('Should pass the authenticated user to the strategy', async () => {
    await usingAsync(createInjector(), async (i) => {
      const testUser: User = { username: 'user@example.com', roles: ['admin'] }
      const strategyFn = vi.fn(async (user: User) => JsonResult(user, 200))
      const strategy: LoginResponseStrategy<User> = { createLoginResponse: strategyFn }

      i.bind(GoogleLoginService, () => createMockService(testUser))

      const action = createGoogleLoginAction(strategy)
      await action({
        request,
        response,
        injector: i,
        getBody: () => Promise.resolve({ token: 'token123' }),
      })

      expect(strategyFn).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'user@example.com', roles: ['admin'] }),
        i,
      )
    })
  })

  it('Should work with a custom result type from strategy', async () => {
    await usingAsync(createInjector(), async (i) => {
      const testUser: User = { username: 'example', roles: [] }
      const tokenStrategy: LoginResponseStrategy<{ accessToken: string; refreshToken: string }> = {
        createLoginResponse: async () => JsonResult({ accessToken: 'access-tok', refreshToken: 'refresh-tok' }, 200),
      }

      i.bind(GoogleLoginService, () => createMockService(testUser))

      const action = createGoogleLoginAction(tokenStrategy)
      const result = await action({
        request,
        response,
        injector: i,
        getBody: () => Promise.resolve({ token: 'token123' }),
      })

      expect(result.chunk.accessToken).toBe('access-tok')
      expect(result.chunk.refreshToken).toBe('refresh-tok')
    })
  })

  it('Should reject when user is not found', async () => {
    await usingAsync(createInjector(), async (i) => {
      const strategy: LoginResponseStrategy<User> = {
        createLoginResponse: async (user) => JsonResult(user, 200),
      }

      i.bind(GoogleLoginService, () => createMockService(undefined))

      const action = createGoogleLoginAction(strategy)
      await expect(
        action({
          request,
          response,
          injector: i,
          getBody: () => Promise.resolve({ token: 'bad-token' }),
        }),
      ).rejects.toThrow('Attached user not found.')
    })
  })

  it('Should propagate errors from getGoogleUserData', async () => {
    await usingAsync(createInjector(), async (i) => {
      const strategy: LoginResponseStrategy<User> = {
        createLoginResponse: async (user) => JsonResult(user, 200),
      }

      i.bind(
        GoogleLoginService,
        (): GoogleLoginService => ({
          clientId: 'test',
          enableCsrfCheck: false,
          getGoogleUserData: vi.fn(async () => {
            throw new Error('Token verification failed')
          }),
          getUserFromGooglePayload: vi.fn(),
        }),
      )

      const action = createGoogleLoginAction(strategy)
      await expect(
        action({
          request,
          response,
          injector: i,
          getBody: () => Promise.resolve({ token: 'bad-token' }),
        }),
      ).rejects.toThrow('Token verification failed')
    })
  })

  describe('CSRF validation', () => {
    it('Should pass when CSRF tokens match and enableCsrfCheck is true', async () => {
      await usingAsync(createInjector(), async (i) => {
        const testUser: User = { username: 'example', roles: [] }
        const strategy: LoginResponseStrategy<User> = {
          createLoginResponse: async (user) => JsonResult(user, 200),
        }

        i.bind(GoogleLoginService, () => createMockService(testUser, true))

        const csrfToken = 'abc123'
        const csrfRequest = {
          url: 'https://google.com',
          headers: { cookie: `g_csrf_token=${csrfToken}; other=value` },
        } as unknown as IncomingMessage

        const action = createGoogleLoginAction(strategy)
        const result = await action({
          request: csrfRequest,
          response,
          injector: i,
          getBody: () => Promise.resolve({ token: 'google-id-token', g_csrf_token: csrfToken }),
        })

        expect(result.chunk.username).toBe('example')
      })
    })

    it('Should reject when CSRF tokens do not match', async () => {
      await usingAsync(createInjector(), async (i) => {
        const strategy: LoginResponseStrategy<User> = {
          createLoginResponse: async (user) => JsonResult(user, 200),
        }

        i.bind(GoogleLoginService, () => createMockService({ username: 'x', roles: [] }, true))

        const csrfRequest = {
          url: 'https://google.com',
          headers: { cookie: 'g_csrf_token=cookie-value' },
        } as unknown as IncomingMessage

        const action = createGoogleLoginAction(strategy)
        await expect(
          action({
            request: csrfRequest,
            response,
            injector: i,
            getBody: () => Promise.resolve({ token: 'tok', g_csrf_token: 'body-value' }),
          }),
        ).rejects.toThrow('CSRF token validation failed.')
      })
    })

    it('Should reject when CSRF cookie is missing', async () => {
      await usingAsync(createInjector(), async (i) => {
        const strategy: LoginResponseStrategy<User> = {
          createLoginResponse: async (user) => JsonResult(user, 200),
        }

        i.bind(GoogleLoginService, () => createMockService(undefined, true))

        const action = createGoogleLoginAction(strategy)
        await expect(
          action({
            request: { url: 'https://google.com', headers: {} } as IncomingMessage,
            response,
            injector: i,
            getBody: () => Promise.resolve({ token: 'tok', g_csrf_token: 'body-value' }),
          }),
        ).rejects.toThrow('CSRF token validation failed.')
      })
    })

    it('Should skip CSRF check when enableCsrfCheck is false', async () => {
      await usingAsync(createInjector(), async (i) => {
        const testUser: User = { username: 'example', roles: [] }
        const strategy: LoginResponseStrategy<User> = {
          createLoginResponse: async (user) => JsonResult(user, 200),
        }

        i.bind(GoogleLoginService, () => createMockService(testUser, false))

        const action = createGoogleLoginAction(strategy)
        const result = await action({
          request: { url: 'https://google.com', headers: {} } as IncomingMessage,
          response,
          injector: i,
          getBody: () => Promise.resolve({ token: 'tok' }),
        })

        expect(result.chunk.username).toBe('example')
      })
    })
  })
})
