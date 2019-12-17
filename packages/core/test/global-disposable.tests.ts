import { Injector } from '@furystack/inject'
import { globalDisposables } from '../src/global-disposables'
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
})
