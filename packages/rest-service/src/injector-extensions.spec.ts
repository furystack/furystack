import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import './injector-extensions'

// tslint:disable: no-string-literal

describe('Injector extensions', () => {
  it('useRestService() Should be added to the injector prototype', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useHttpAuthentication().useRestService({ api: {}, port: 19999, root: '/api' })
    })
  })

  it('useHttpAuthentication() Should be added to the injector prototype', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.useHttpAuthentication().useHttpAuthentication()
    })
  })
})
