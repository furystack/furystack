import { Injector } from '@furystack/inject'
import { globalDisposables, exitHandler } from './global-disposables.js'
import { disposeOnProcessExit } from './helpers.js'
import { describe, it, expect, vi } from 'vitest'

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

  it('Should be filled from an injector extension', async () => {
    const i = new Injector()
    disposeOnProcessExit(i)
    expect(globalDisposables).toContain(i)
    globalDisposables.delete(i)
    await i.dispose()
  })
  it('Should dispose the injector on exit', async () => {
    const i = new Injector()
    i.dispose = vi.fn(i.dispose)
    disposeOnProcessExit(i)
    await exitHandler()
    expect(i.dispose).toBeCalled()
    globalDisposables.delete(i)
  })
})
