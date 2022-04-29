import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { useHttpAuthentication } from './helpers'

describe('Injector extensions', () => {
  describe('useHttpAuthentication', () => {
    it('Should set up HTTP Authentication', async () => {
      await usingAsync(new Injector(), async (i) => {
        useHttpAuthentication(i)
        // TODO: Check if HTTP Auth has been set up
      })
    })
  })

  describe('useRestService()', () => {
    it.todo(
      'Should set up a REST service',
      // await usingAsync(new Injector(), async (i) => {
      //   useRestService({ injector: i, api: {},  })
      //   TODO: Assert if REST service has been set up
      // })
    )
  })
})
