import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it } from 'vitest'
import { IsAuthenticated } from './is-authenticated.js'

describe('isAuthenticated', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('returns the authentication status from the identity context', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => ({
        isAuthenticated: () => Promise.resolve(true),
        isAuthorized: () => Promise.resolve(true),
        getCurrentUser: () => Promise.reject(new Error('not needed')),
      }))
      const result = await IsAuthenticated({ injector: i, request, response })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual({ isAuthenticated: true })
    })
  })
})
