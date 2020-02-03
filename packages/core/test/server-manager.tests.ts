import { createServer } from 'http'
import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { ServerManager } from '../src'
import '@furystack/logging'

describe('ServerManager', () => {
  it('Can be constructed', () => {
    using(new Injector(), i => {
      i.useLogging()
      expect(i.getInstance(ServerManager)).toBeInstanceOf(ServerManager)
    })
  })

  it('Servers can be added and disposed gracefully', async () => {
    const i = new Injector()
    i.useLogging()
    const sm = i.getInstance(ServerManager)
    const s = createServer()
    const s2 = createServer()
    s.listen(12345)
    sm.set(s)
    sm.set(s2)
    expect(sm.getServers()).toContain(s)
    expect(sm.getServers()).toContain(s2)
    await i.dispose()
  })
})
