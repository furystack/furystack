import { Injector } from '@furystack/inject'
import { globalDisposables, exitHandler } from '../src/global-disposables'
import '../src/injector-extensions'

describe('Global Disposables', () => {
  it('Should be empty by default', () => {
    expect(globalDisposables.size).toBe(0)
  })

  it('Should be filled from an injector extension', () => {
    const i = new Injector()
    i.disposeOnProcessExit()

    expect(globalDisposables).toContain(i)
  })

  it('Should attach event listeners', () => {
    expect(process.listeners('exit')).toContain(exitHandler)
    expect(process.listeners('SIGINT')).toContain(exitHandler)
    expect(process.listeners('SIGUSR1')).toContain(exitHandler)
    expect(process.listeners('SIGUSR2')).toContain(exitHandler)
    expect(process.listeners('uncaughtException')).toContain(exitHandler)
  })
})
