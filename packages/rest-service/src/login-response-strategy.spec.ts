import { InMemoryStore, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'

import { useHttpAuthentication } from './helpers.js'
import { createCookieLoginStrategy } from './login-response-strategy.js'
import { DefaultSession } from './models/default-session.js'

const setupInjector = (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  const repo = getRepository(i)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(PasswordResetToken, 'token')

  usePasswordPolicy(i)
  useHttpAuthentication(i)
}

describe('createCookieLoginStrategy', () => {
  const testUser: User = { username: 'testuser', roles: ['admin'] }

  it('Should return the user as the response body', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.chunk).toEqual(testUser)
    })
  })

  it('Should return status code 200', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.statusCode).toBe(200)
    })
  })

  it('Should include a Set-Cookie header with the session ID', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      const setCookie = result.headers['Set-Cookie']
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('fss=')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).toContain('HttpOnly')
    })
  })

  it('Should persist the session in the DataSet', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      await strategy.createLoginResponse(testUser, i)

      const repo = getRepository(i)
      const sessionDataSet = repo.getDataSetFor(DefaultSession, 'sessionId')
      const sessions = await sessionDataSet.find(i, { filter: { username: { $eq: 'testuser' } } })
      expect(sessions).toHaveLength(1)
      expect(sessions[0].username).toBe('testuser')
      expect(sessions[0].sessionId).toBeTruthy()
    })
  })

  it('Should create unique session IDs for each call', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)

      const result1 = await strategy.createLoginResponse(testUser, i)
      const result2 = await strategy.createLoginResponse(testUser, i)

      const sessionId1 = result1.headers['Set-Cookie']?.split('=')[1]?.split(';')[0]
      const sessionId2 = result2.headers['Set-Cookie']?.split('=')[1]?.split(';')[0]
      expect(sessionId1).not.toBe(sessionId2)
    })
  })
})
