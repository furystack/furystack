import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import '@furystack/logging'
import './injector-extensions'

// tslint:disable: no-string-literal

describe('Injector extensions', () => {
  it('Should be added to the injector prototype', async () => {
    await usingAsync(new Injector(), async i => {
      i.useHttpAuthentication().useRestService({ api: {}, port: 19999, root: '/api' })
    })
  })
})
