import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { globalDisposables, exitHandler } from './global-disposables'
import { disposeOnProcessExit } from './helpers'

describe('Global Disposables', () => {
  it('Should be empty by default', () => {
    expect(globalDisposables.size).toBe(0)
  })

  it('Should attach event listeners', () => {
    expect(process.listeners('exit')).toContain(exitHandler)
    expect(process.listeners('SIGINT')).toContain(exitHandler)
    expect(process.listeners('SIGUSR1')).toContain(exitHandler)
    expect(process.listeners('SIGUSR2')).toContain(exitHandler)
    expect(process.listeners('uncaughtException')).toContain(exitHandler)
  })

  it('Should be filled from an injector extension', () => {
    using(new Injector(), (i) => {
      disposeOnProcessExit(i)
      expect(globalDisposables).toContain(i)
    })
  })
  it('Should dispose the injector on exit', async () => {
    usingAsync(new Injector(), async (i) => {
      i.dispose = jest.fn(i.dispose)
      disposeOnProcessExit(i)
      await exitHandler()
      expect(i.dispose).toBeCalled()
    })
  })
})
