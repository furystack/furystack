import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ErrorAction } from './error-action'
import type { IncomingMessage } from 'http'
import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'
import type { ServerResponse } from 'http'
import { describe, expect, it } from 'vitest'

describe('ErrorAction tests', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('returns the error in the standard format', async () => {
    await usingAsync(new Injector(), async (i) => {
      const result = await ErrorAction({
        injector: i,
        getBody: async () => new Error('Something went wrong'),
        request,
        response,
      })
      expect(result.statusCode).toBe(500)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })

  it('returns the error code from request errors', async () => {
    await usingAsync(new Injector(), async (i) => {
      const result = await ErrorAction({
        request,
        response,
        injector: i,
        getBody: async () => new RequestError('Something went wrong', 401),
      })
      expect(result.statusCode).toBe(401)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })

  it('returns the 403 for authorization errors', async () => {
    await usingAsync(new Injector(), async (i) => {
      const result = await ErrorAction({
        request,
        response,
        injector: i,
        getBody: async () => new AuthorizationError('Something went wrong'),
      })
      expect(result.statusCode).toBe(403)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })
})
