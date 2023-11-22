import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { IsAuthenticated } from './is-authenticated.js'
import type { IncomingMessage, ServerResponse } from 'http'
import { IdentityContext } from '@furystack/core'
import { describe, it, expect } from 'vitest'

describe('isAuthenticated', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse
  it('exec', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance({ isAuthenticated: async () => true }, IdentityContext)
      const result = await IsAuthenticated({ injector: i, request, response } as any)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual({ isAuthenticated: true })
    })
  })
})
