import { createInjector } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { describe, expect, it, vi } from 'vitest'
import type ws from 'ws'
import { WhoAmI } from './whoami.js'

describe('WhoAmI action', () => {
  const currentUser = { username: 'testuser' }
  const contextMock: HttpUserContext = { getCurrentUser: async () => currentUser } as unknown as HttpUserContext
  const request = { url: 'https://google.com' } as IncomingMessage
  const wsMock = {
    send: vi.fn(() => undefined),
  } as unknown as ws & { send: (this: void, ...args: unknown[]) => void }

  it('cannot be executed if data does not match', () => {
    expect(WhoAmI.canExecute({ request, data: 'asd', socket: wsMock })).toBeFalsy()
  })

  it('can be executed with whoami', () => {
    expect(WhoAmI.canExecute({ request, data: 'whoami', socket: wsMock })).toBeTruthy()
  })

  it('can be executed with whoami /claims', () => {
    expect(WhoAmI.canExecute({ request, data: 'whoami /claims', socket: wsMock })).toBeTruthy()
  })

  it('resolves HttpUserContext from the action injector and sends the current user', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(HttpUserContext, () => contextMock)
      await WhoAmI.execute({ request, data: 'whoami', socket: wsMock, injector })
      expect(wsMock.send).toBeCalledWith(JSON.stringify({ currentUser }))
    })
  })

  it('sends null when HttpUserContext rejects', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const failing = { getCurrentUser: async () => Promise.reject(new Error('no user')) } as unknown as HttpUserContext
      injector.bind(HttpUserContext, () => failing)
      await WhoAmI.execute({ request, data: 'whoami', socket: wsMock, injector })
      expect(wsMock.send).toHaveBeenLastCalledWith(JSON.stringify({ currentUser: null }))
    })
  })
})
