import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import '@furystack/logging'
import './injector-extensions'

// tslint:disable: no-string-literal

describe('Injector extensions', () => {
  it('Should be added to the injector prototype', () => {
    using(new Injector(), i => {
      i.useRestService({ api: {}, port: 19999 }).useHttpAuthentication()
    })
  })
})
