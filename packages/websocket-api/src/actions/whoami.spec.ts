import { WhoAmI } from './whoami'
import { HttpUserContext } from '@furystack/rest-service'
import ws from 'ws'
import { usingAsync } from '@furystack/utils'

describe('Whoami action', () => {
  const currentUser = { username: 'testuser' }
  const contextMock: HttpUserContext = ({ getCurrentUser: async () => currentUser } as unknown) as HttpUserContext
  const wsMock: ws = ({
    send: jest.fn(() => undefined),
  } as unknown) as ws

  it('cannot be executed if data does not match', () => {
    expect(WhoAmI.canExecute('asd')).toBeFalsy()
  })

  it('can be executed with whoami', () => {
    expect(WhoAmI.canExecute('whoami')).toBeTruthy()
  })

  it('can be executed with whoami /claims', () => {
    expect(WhoAmI.canExecute('whoami /claims')).toBeTruthy()
  })

  it('Should return the current user', async () => {
    await usingAsync(new WhoAmI(contextMock, wsMock), async (instance) => {
      await instance.execute()
      expect(wsMock.send).toBeCalledWith(JSON.stringify({ currentUser }))
    })
  })
})
