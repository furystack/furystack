import { Injector } from '@furystack/inject'
import { describe, expect, it, vi } from 'vitest'
import { exitHandler, globalDisposables } from './global-disposables.js'
import { disposeOnProcessExit } from './helpers.js'

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
    await i[Symbol.asyncDispose]()
  })
  it('Should dispose the injector on exit', async () => {
    const i = new Injector()
    i[Symbol.asyncDispose] = vi.fn(i[Symbol.asyncDispose])
    disposeOnProcessExit(i)
    await exitHandler()
    expect(i[Symbol.asyncDispose]).toBeCalled()
    globalDisposables.delete(i)
  })
})
