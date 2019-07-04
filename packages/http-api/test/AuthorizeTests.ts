import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { visitorUser } from '@furystack/core'
import { Authorize, EmptyResult, HttpUserContext } from '../src'

describe('Authorize', () => {
  it('Should return 403 when unauthorized', async () => {
    await usingAsync(new Injector(), async i => {
      const isAuthorizedAction = jest.fn(async () => false)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        { isAuthorized: isAuthorizedAction, getCurrentUser: async () => visitorUser },
        HttpUserContext,
      )
      const exampleAuthorizedAction = jest.fn(async (_i: Injector) => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)

      const result = await authorized(i)
      expect(result.statusCode).toBe(403)
      expect(result.chunk).toBe(JSON.stringify({ error: 'forbidden' }))
      expect(exampleAuthorizedAction).not.toBeCalled()
    })
  })

  it('Should exec the original action if authorized', async () => {
    await usingAsync(new Injector(), async i => {
      const isAuthorizedAction = jest.fn(async () => true)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        { isAuthorized: isAuthorizedAction, getCurrentUser: async () => visitorUser },
        HttpUserContext,
      )
      const exampleAuthorizedAction = jest.fn(async (_i: Injector) => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)

      const result = await authorized(i)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAuthorizedAction).toBeCalledWith(i)
    })
  })
})
