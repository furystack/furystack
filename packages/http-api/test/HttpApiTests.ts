import { IUser, LoggerCollection, visitorUser } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpApiConfiguration, HttpAuthenticationSettings, HttpUserContext, IRequestAction } from '../src'
import { HttpApi } from '../src/HttpApi'

// tslint:disable:max-classes-per-file

describe('HttpApi tests', () => {
  it('Can be constructed', async () => {
    await usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      i.setInstance(new HttpApiConfiguration({ serverFactory: () => ({} as any) }))
      i.setInstance({}, IncomingMessage)
      i.setInstance({}, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        expect(api).toBeInstanceOf(HttpApi)
      })
    })
  })

  it('Can be activated', async () => {
    await usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      i.setInstance(
        new HttpApiConfiguration({
          serverFactory: () => ({ on: (ev: string, callback: () => void) => callback(), listen: () => null } as any),
        }),
      )
      i.setInstance({}, IncomingMessage)
      i.setInstance({}, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        await api.activate()
      })
    })
  })

  it('NotFound Action is executed when no other action is awailable', done => {
    usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      @Injectable()
      class ExampleNotFoundAction implements IRequestAction {
        public async exec() {
          done()
        }
        public dispose() {
          /** */
        }
      }
      i.setInstance(
        new HttpApiConfiguration({
          notFoundAction: ExampleNotFoundAction as any,
          serverFactory: () => ({ on: (ev: string, callback: () => void) => callback(), listen: () => null } as any),
        }),
      )
      i.setInstance({}, IncomingMessage)
      i.setInstance({}, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        await api.activate()
        api.mainRequestListener({} as any, {} as any)
      })
    })
  })

  it('Action can be executed', done => {
    usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      @Injectable()
      class ExampleAction implements IRequestAction {
        public async exec() {
          const currentUser = await this.userContext.getCurrentUser()
          const currentUser2 = await this.userContext.getCurrentUser()
          expect(currentUser.username).toEqual(visitorUser.username)
          expect(currentUser2.username).toEqual(visitorUser.username)
          // tslint:disable-next-line:no-string-literal
          this.perRequestInjector['cachedSingletons'].has(this.userContext.constructor)
          done()
        }
        public dispose() {
          /** */
        }

        /**
         *
         */
        constructor(private userContext: HttpUserContext<IUser>, private perRequestInjector: Injector) {}
      }
      i.setInstance(
        new HttpApiConfiguration({
          actions: [() => ExampleAction],
          serverFactory: () => ({ on: (ev: string, callback: () => void) => callback(), listen: () => null } as any),
        }),
      )
      i.setInstance(new HttpAuthenticationSettings())
      i.setInstance({ headers: {} }, IncomingMessage)
      i.setInstance({ writeHead: () => null, end: () => null }, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        await api.activate()
        api.mainRequestListener({} as any, {} as any)
      })
    })
  })

  it('Should throw error if multiple actions are resolved for a request', done => {
    usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      @Injectable()
      class ExampleAction implements IRequestAction {
        public async exec() {
          done()
        }
        public dispose() {
          /** */
        }
      }
      i.setInstance(
        new HttpApiConfiguration({
          actions: [() => ExampleAction, () => ExampleAction],
          serverFactory: () => ({ on: (ev: string, callback: () => void) => callback(), listen: () => null } as any),
        }),
      )
      i.setInstance({}, IncomingMessage)
      i.setInstance({}, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        await api.activate()
        try {
          await api.mainRequestListener({} as any, {} as any)
          done('Should throw error')
        } catch (error) {
          done()
        }
      })
    })
  })

  it('Error Action is executed on other action errors executed', done => {
    usingAsync(new Injector({ parent: undefined, owner: 'Test' }), async i => {
      @Injectable()
      class ExampleFailAction implements IRequestAction {
        public async exec() {
          throw Error(':(')
        }
        public dispose() {
          /** */
        }
      }

      @Injectable()
      class ExampleErrorAction implements IRequestAction {
        public async returnError(error: any) {
          done()
        }
        public async exec() {
          /**  */
        }
        public dispose() {
          /** */
        }
      }

      i.setInstance(
        new HttpApiConfiguration({
          actions: [() => ExampleFailAction],
          errorAction: ExampleErrorAction as any,
          serverFactory: () => ({ on: (ev: string, callback: () => void) => callback(), listen: () => null } as any),
        }),
      )
      i.setInstance({}, IncomingMessage)
      i.setInstance({}, ServerResponse)
      i.setInstance(new LoggerCollection())
      await usingAsync(i.getInstance(HttpApi, true), async api => {
        await api.activate()
        api.mainRequestListener({} as any, {} as any)
      })
    })
  })
})
