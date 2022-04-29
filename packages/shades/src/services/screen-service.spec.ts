import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ScreenService } from './screen-service'

describe('ScreenService', () => {
  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Shuld be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const s = i.getInstance(ScreenService)
      expect(s).toBeInstanceOf(ScreenService)
    })
  })

  it('Shuld update state on events', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.getInstance(ScreenService)
      /** TODO */
    })
  })
})
