import { Injector, Constructable } from '@furystack/inject'
import { LoggerCollection } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { User, InMemoryStore } from '@furystack/core'
import { HttpUserContext, RequestAction, EmptyResult, HttpApi, DefaultSession } from '../src'

// tslint:disable:max-classes-per-file

describe('HttpApi tests', () => {
  const getInjector = () => {
    const i = new Injector()
    i.setupStores(sm =>
      sm
        .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
        .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
    )
    return i
  }

  it('Can be constructed', async () => {
    await usingAsync(getInjector(), async i => {
      i.useHttpApi()
      expect(i.getInstance(HttpApi)).toBeInstanceOf(HttpApi)
    })
  })

  it('NotFound Action is executed when no other action is awailable', done => {
    usingAsync(getInjector(), async i => {
      const ExampleNotFoundAction: RequestAction = async () => {
        done()
        return EmptyResult()
      }
      i.useLogging(LoggerCollection)
      i.useHttpApi({
        notFoundAction: ExampleNotFoundAction,
      })
      await i.getInstance(HttpApi).mainRequestListener({} as any, { sendActionResult: () => undefined } as any)
    })
  })

  it('Action can be executed', done => {
    usingAsync(getInjector(), async i => {
      const ExampleAction: RequestAction = async injector => {
        try {
          const userContext = injector.getInstance(HttpUserContext)
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
      await i
        .getInstance(HttpApi)
        .mainRequestListener({ headers: {} } as any, { sendActionResult: () => undefined } as any)
    })
  })

  it('Should throw error if multiple actions are resolved for a request', done => {
    usingAsync(getInjector(), async i => {
      const ExampleAction: RequestAction = async injector => {
        done()
        return EmptyResult()
      }
      i.useHttpApi({
        actions: [() => ExampleAction, () => ExampleAction],
      })
      try {
        await i.getInstance(HttpApi).mainRequestListener({} as any, { sendActionResult: () => undefined } as any)
        done('Should throw error')
      } catch (error) {
        done()
      }
    })
  })

  it('Error Action is executed on other action errors executed', done => {
    usingAsync(getInjector(), async i => {
      const ExampleFailAction: RequestAction = async () => {
        throw Error(':(')
      }

      const ExampleErrorAction: RequestAction = async injector => {
        done()
        return EmptyResult()
      }
      i.setExplicitInstance(new LoggerCollection())
      i.useHttpApi({
        actions: [() => ExampleFailAction],
        errorAction: ExampleErrorAction as any,
      })
      await i.getInstance(HttpApi).mainRequestListener({} as any, { sendActionResult: () => undefined } as any)
    })
  })
})
