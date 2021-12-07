import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { LocationService } from './'
import { JSDOM } from 'jsdom'

describe('LocationService', () => {
  const oldDoc = document

  beforeAll(() => {
    globalThis.document = new JSDOM().window.document
  })

  afterAll(() => {
    globalThis.document = oldDoc
  })

  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Shuld be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const s = i.getInstance(LocationService)
      expect(s).toBeInstanceOf(LocationService)
    })
  })

  it('Shuld update state on events', async () => {
    await usingAsync(new Injector(), async (i) => {
      const onLocaionChanged = jest.fn()
      const s = i.getInstance(LocationService)
      s.onLocationChanged.subscribe(onLocaionChanged)
      expect(onLocaionChanged).toBeCalledTimes(0)
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(onLocaionChanged).toBeCalledTimes(1)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      expect(onLocaionChanged).toBeCalledTimes(2)
      history.pushState(null, '/')
      expect(onLocaionChanged).toBeCalledTimes(3)
      history.replaceState(null, '/')
      expect(onLocaionChanged).toBeCalledTimes(4)
    })
  })
})
