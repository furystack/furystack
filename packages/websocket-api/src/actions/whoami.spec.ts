import { WhoAmI } from './whoami'
import { HttpUserContext } from '@furystack/rest-service'
import ws from 'ws'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'

describe('Whoami action', () => {
  const currentUser = { username: 'testuser' }
  const contextMock: HttpUserContext = { getCurrentUser: async () => currentUser } as unknown as HttpUserContext

  const request = { url: 'https://google.com' } as IncomingMessage

  const wsMock: ws = {
    send: jest.fn(() => undefined),
  } as unknown as ws

  it('cannot be executed if data does not match', () => {
    expect(WhoAmI.canExecute({ request, data: 'asd' })).toBeFalsy()
  })

  it('can be executed with whoami', () => {
    expect(WhoAmI.canExecute({ request, data: 'whoami' })).toBeTruthy()
  })

  it('can be executed with whoami /claims', () => {
    expect(WhoAmI.canExecute({ request, data: 'whoami /claims' })).toBeTruthy()
  })

  it('Should return the current user', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(contextMock, HttpUserContext)
      injector.setExplicitInstance(wsMock, ws)
      const instance = injector.getInstance(WhoAmI)

      await instance.execute({ request, data: '' })
      expect(wsMock.send).toBeCalledWith(JSON.stringify({ currentUser }))
    })
  })
})
