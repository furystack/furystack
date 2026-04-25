import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { exitHandler, globalDisposables } from './global-disposables.js'
import { disposeOnProcessExit } from './helpers.js'

describe('Global Disposables', () => {
  it('is empty by default', () => {
    expect(globalDisposables.size).toBe(0)
  })

  it('attaches process event listeners for termination signals', () => {
    expect(process.listeners('exit')).toContain(exitHandler)
    expect(process.listeners('SIGINT')).toContain(exitHandler)
    expect(process.listeners('SIGUSR1')).toContain(exitHandler)
    expect(process.listeners('SIGUSR2')).toContain(exitHandler)
    expect(process.listeners('uncaughtException')).toContain(exitHandler)
  })

  it('registers an injector through disposeOnProcessExit', async () => {
    await usingAsync(createInjector(), async (i) => {
      disposeOnProcessExit(i)
      expect(globalDisposables).toContain(i)
      globalDisposables.delete(i)
    })
  })

  it('disposes the registered injector on exit', () => {
    // Not using usingAsync here because exitHandler() itself disposes the injector
    const i = createInjector()
    const disposeSpy = vi.fn(i[Symbol.asyncDispose].bind(i))
    i[Symbol.asyncDispose] = disposeSpy
    disposeOnProcessExit(i)
    exitHandler()
    expect(disposeSpy).toHaveBeenCalled()
    globalDisposables.delete(i)
  })
})
