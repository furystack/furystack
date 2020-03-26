import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { User } from '@furystack/core'
import { HttpUserContext } from './http-user-context'
import { Authorize } from './authorize'
import { EmptyResult } from '@furystack/rest'

describe('Authorize', () => {
  it('Should return 403 when failed to get current user', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = jest.fn(async () => false)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        { isAuthorized: isAuthorizedAction, getCurrentUser: () => Promise.reject(':(') },
        HttpUserContext,
      )
      const exampleAuthorizedAction = jest.fn(async (_args: any) => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)

      const result = await authorized({ injector: i })
      expect(result.statusCode).toBe(403)
      expect(result.chunk).toEqual({ error: 'forbidden' })
      expect(exampleAuthorizedAction).not.toBeCalled()
    })
  })

  it('Should return 403 if the current user does not have the role', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = jest.fn(async () => false)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        {
          isAuthorized: isAuthorizedAction,
          getCurrentUser: async () => Promise.resolve<User>({ username: 'a', roles: ['Role1'] }),
        },
        HttpUserContext,
      )
      const exampleAuthorizedAction = jest.fn(async (_args: any) => EmptyResult())
      const authorized = Authorize('Role2')(exampleAuthorizedAction)

      const result = await authorized({ injector: i })
      expect(result.statusCode).toBe(403)
      expect(result.chunk).toEqual({ error: 'forbidden' })
      expect(exampleAuthorizedAction).not.toBeCalled()
    })
  })

  it('Should exec the original action if authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = jest.fn(async () => true)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        {
          isAuthorized: isAuthorizedAction,
          getCurrentUser: async () => Promise.resolve<User>({ username: 'a', roles: ['Role1'] }),
        },
        HttpUserContext,
      )
      const exampleAuthorizedAction = jest.fn(async (_args: any) => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)
      const params = { injector: i, body: undefined, query: undefined }
      const result = await authorized(params)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAuthorizedAction).toBeCalledWith(params)
    })
  })
})
