import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import '@furystack/logging'
import { LocationService } from './'
import { JSDOM } from 'jsdom'

describe('LocationService', () => {
  it('Shuld be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const dom = new JSDOM()
      ;(global as any).window = dom.window
      i.useLogging()
      i.setExplicitInstance(dom.window, Window)
      const s = i.getInstance(LocationService)
      expect(s).toBeInstanceOf(LocationService)
    })
  })
})
