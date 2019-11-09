import { using } from '@sensenet/client-utils'
import { Injector } from '@furystack/inject'
import { GoogleLoginService } from '../src/login-service'

describe('Google Login Service', () => {
  it('Can be constructed', () => {
    /** */
    using(new Injector(), i => {
      i.getInstance(GoogleLoginService)
    })
  })
})
