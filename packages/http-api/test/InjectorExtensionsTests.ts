import { HttpApiSettings } from '../src'
import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'

// tslint:disable: no-string-literal

describe('Injector extensions', () => {
  it('Should be added to the injector prototype', () => {
    using(new Injector(), i => {
      i.useHttpApi()
        .useHttpAuthentication()
        .useDefaultLoginRoutes()
      expect(i['cachedSingletons'].has(HttpApiSettings))
    })
  })
})
