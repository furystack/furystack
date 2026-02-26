import type { User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import type { LoginResponseStrategy } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'

import { createGoogleLoginAction } from './login-action.js'
import { GoogleLoginService } from './login-service.js'

describe('createGoogleLoginAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('Should delegate to the strategy after Google login', async () => {
    await usingAsync(new Injector(), async (i) => {
      const testUser: User = { username: 'example', roles: [] }
      const strategyFn = vi.fn(async (user: User) => JsonResult(user, 200))
      const strategy: LoginResponseStrategy<User> = { createLoginResponse: strategyFn }

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = () => Promise.resolve(testUser)

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
    await usingAsync(new Injector(), async (i) => {
      const testUser: User = { username: 'user@example.com', roles: ['admin'] }
      const strategyFn = vi.fn(async (user: User) => JsonResult(user, 200))
      const strategy: LoginResponseStrategy<User> = { createLoginResponse: strategyFn }

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = () => Promise.resolve(testUser)

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
    await usingAsync(new Injector(), async (i) => {
      const testUser: User = { username: 'example', roles: [] }
      const tokenStrategy: LoginResponseStrategy<{ accessToken: string; refreshToken: string }> = {
        createLoginResponse: async () => JsonResult({ accessToken: 'access-tok', refreshToken: 'refresh-tok' }, 200),
      }

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = () => Promise.resolve(testUser)

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

  it('Should propagate errors from GoogleLoginService', async () => {
    await usingAsync(new Injector(), async (i) => {
      const strategy: LoginResponseStrategy<User> = {
        createLoginResponse: async (user) => JsonResult(user, 200),
      }

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = () => Promise.reject(new Error('Attached user not found.'))

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
})
