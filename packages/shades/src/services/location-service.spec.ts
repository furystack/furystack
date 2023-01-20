import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { LocationService } from './'

describe('LocationService', () => {
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
      s.onLocationPathChanged.subscribe(onLocaionChanged)
      expect(onLocaionChanged).toBeCalledTimes(0)
      history.pushState(null, '', '/loc1')
      expect(onLocaionChanged).toBeCalledTimes(1)
      history.replaceState(null, '', '/loc2')
      expect(onLocaionChanged).toBeCalledTimes(2)

      // TODO: Figure out testing hashchange and popstate subscriptions
      // window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: '/loc3' }))
      // expect(onLocaionChanged).toBeCalledTimes(3)
      // window.dispatchEvent(new PopStateEvent('popstate', {}))
      // expect(onLocaionChanged).toBeCalledTimes(4)
    })
  })
})
