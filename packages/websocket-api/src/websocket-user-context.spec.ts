import { Injector } from '@furystack/inject'
import { IncomingMessage } from 'http'
import '.'
import { HttpUserContext } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { WebsocketUserContext } from './websocket-user-context'
import { describe, expect, it, vi } from 'vitest'

describe('WebSocket User Context', () => {
  const mockUser = { username: 'mock@gmail.com', roles: [] }
  const mockAdmin = { username: 'mock@gmail.com', roles: ['admin'] }

  describe('isAuthenticated', () => {
    it('should authenticate with HttpUserContext and the IncomingMessage', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authFn = vi.fn(async () => mockUser)
        const incomingMessage = {}
        i.setExplicitInstance(incomingMessage, IncomingMessage)
        i.setExplicitInstance({ authenticateRequest: authFn }, HttpUserContext)
        const authResult = await i.getInstance(WebsocketUserContext).isAuthenticated()
        expect(authResult).toBeTruthy()
        expect(authFn).toBeCalledWith(incomingMessage)
      })
    })

    it('should return false if HttpUserContext throws', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authFn = vi.fn(() => Promise.reject('Hey! No user here!'))
        const incomingMessage = {}
        i.setExplicitInstance(incomingMessage, IncomingMessage)
        i.setExplicitInstance({ authenticateRequest: authFn }, HttpUserContext)
        const authResult = await i.getInstance(WebsocketUserContext).isAuthenticated()
        expect(authResult).toBeFalsy()
        expect(authFn).toBeCalledWith(incomingMessage)
      })
    })
  })

  describe('isAuthorized', () => {
    it('should return true if the user has the role', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authFn = vi.fn(async () => mockAdmin)
        const incomingMessage = {}
        i.setExplicitInstance(incomingMessage, IncomingMessage)
        i.setExplicitInstance({ authenticateRequest: authFn }, HttpUserContext)
        const authResult = await i.getInstance(WebsocketUserContext).isAuthorized('admin')
        expect(authResult).toBe(true)
      })
    })

    it('should return false if the user does not have the role', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authFn = vi.fn(async () => mockUser)
        const incomingMessage = {}
        i.setExplicitInstance(incomingMessage, IncomingMessage)
        i.setExplicitInstance({ authenticateRequest: authFn }, HttpUserContext)
        const authResult = await i.getInstance(WebsocketUserContext).isAuthorized('admin')
        expect(authResult).toBe(false)
      })
    })

    it('should return false if getting the current user throws', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authFn = vi.fn(() => Promise.reject('Hey! No user here!'))
        const incomingMessage = {}
        i.setExplicitInstance(incomingMessage, IncomingMessage)
        i.setExplicitInstance({ authenticateRequest: authFn }, HttpUserContext)
        const authResult = await i.getInstance(WebsocketUserContext).isAuthorized('admin')
        expect(authResult).toBe(false)
      })
    })
  })
})
