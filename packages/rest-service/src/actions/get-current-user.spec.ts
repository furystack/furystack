import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it } from 'vitest'
import { GetCurrentUser } from './get-current-user.js'

describe('getCurrentUser', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('returns the current user in a JSON result', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => ({
        getCurrentUser: () => Promise.resolve(testUser as never),
        isAuthenticated: () => Promise.resolve(true),
        isAuthorized: () => Promise.resolve(true),
      }))
      const result = await GetCurrentUser({ injector: i, request, response })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual(testUser)
    })
  })
})
