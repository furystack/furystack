import { IncomingMessage, ServerResponse } from 'http'
import { visitorUser } from '@furystack/core'
import { Injector, Constructable } from '@furystack/inject'
import { LoggerCollection } from '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext, RequestAction, EmptyResult } from '../src'
import { HttpApi } from '../src/HttpApi'

// tslint:disable:max-classes-per-file

describe('HttpApi tests', () => {
  it('Can be constructed', async () => {
    await usingAsync(new Injector(), async i => {
      i.useHttpApi()
      expect(i.getInstance(HttpApi)).toBeInstanceOf(HttpApi)
    })
  })

  it('NotFound Action is executed when no other action is awailable', done => {
    usingAsync(new Injector(), async i => {
      const ExampleNotFoundAction: RequestAction = async injector => {
        done()
        return EmptyResult()
      }
      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      i.useLogging(LoggerCollection)
      i.useHttpApi({
        notFoundAction: ExampleNotFoundAction,
      })
      await i.getInstance(HttpApi).mainRequestListener({} as any, {} as any)
    })
  })

  it('Action can be executed', done => {
    usingAsync(new Injector(), async i => {
      const ExampleAction: RequestAction = async injector => {
        try {
          const userContext = injector.getInstance(HttpUserContext)
          const currentUser = await userContext.getCurrentUser()
          const currentUser2 = await userContext.getCurrentUser()
          expect(currentUser.username).toEqual(visitorUser.username)
          expect(currentUser2.username).toEqual(visitorUser.username)
          // tslint:disable-next-line:no-string-literal
          injector['cachedSingletons'].has(userContext.constructor as Constructable<any>)
          done()
        } catch (error) {
          done(error)
        }
        return EmptyResult()
      }

      i.useHttpApi({
        actions: [() => ExampleAction],
      })
      await i.getInstance(HttpApi).mainRequestListener({ headers: {} } as any, {} as any)
    })
  })

  it('Should throw error if multiple actions are resolved for a request', done => {
    usingAsync(new Injector(), async i => {
      const ExampleAction: RequestAction = async injector => {
        done()
        return EmptyResult()
      }
      i.useHttpApi({
        actions: [() => ExampleAction, () => ExampleAction],
      })
      try {
        await i.getInstance(HttpApi).mainRequestListener({} as any, {} as any)
        done('Should throw error')
      } catch (error) {
        done()
      }
    })
  })

  it('Error Action is executed on other action errors executed', done => {
    usingAsync(new Injector(), async i => {
      const ExampleFailAction: RequestAction = async () => {
        throw Error(':(')
      }

      const ExampleErrorAction: RequestAction = async injector => {
        done()
        return EmptyResult()
      }

      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      i.setExplicitInstance(new LoggerCollection())
      i.useHttpApi({
        actions: [() => ExampleFailAction],
        errorAction: ExampleErrorAction as any,
      })
      i.getInstance(HttpApi).mainRequestListener({} as any, {} as any)
    })
  })
})
