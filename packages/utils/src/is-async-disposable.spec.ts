import { describe, expect, it } from 'vitest'
import { isAsyncDisposable } from './is-async-disposable.js'

describe('isAsyndDisposable', () => {
  it('should return true if the value is an instance of an async disposable object', () => {
    const asyncDisposable = {
      [Symbol.asyncDispose]: () => {},
    }
    expect(isAsyncDisposable(asyncDisposable)).toBe(true)
  })

  it('Should return false is the object has Symbol.asyncDispose but it is not a function', () => {
    const asyncDisposable = {
      [Symbol.asyncDispose]: 'not a function',
    }
    expect(isAsyncDisposable(asyncDisposable)).toBe(false)
  })

  it('Should return false is the object does not have Symbol.asyncDispose', () => {
    const asyncDisposable = {}
    expect(isAsyncDisposable(asyncDisposable)).toBe(false)
  })
})
