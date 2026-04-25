import { createInjector } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import type { HttpUserContext } from '../http-user-context.js'
import { HttpUserContext as HttpUserContextToken } from '../http-user-context.js'
import { LogoutAction } from './logout.js'

describe('LogoutAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('delegates to HttpUserContext.cookieLogout and returns an empty result', async () => {
    await usingAsync(createInjector(), async (i) => {
      const cookieLogout = vi.fn(async () => {
        /* noop */
      })
      const stub = Object.assign(new EventHub(), { cookieLogout }) as unknown as HttpUserContext
      i.bind(HttpUserContextToken, () => stub)

      const result = await LogoutAction({ request, response, injector: i })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(cookieLogout).toHaveBeenCalled()
    })
  })
})
