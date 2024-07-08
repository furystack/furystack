import { describe, expect, it } from 'vitest'
import { isDisposable } from './is-disposable.js'

describe('isDisposable', () => {
  it('should return true if the value is an instance of a disposable object', () => {
    const disposable = {
      [Symbol.dispose]: () => {},
    }
    expect(isDisposable(disposable)).toBe(true)
  })

  it('Should return false is the object has Symbol.dispose but it is not a function', () => {
    const disposable = {
      [Symbol.dispose]: 'not a function',
    }
    expect(isDisposable(disposable)).toBe(false)
  })

  it('Should return false is the object does not have Symbol.dispose', () => {
    const disposable = {}
    expect(isDisposable(disposable)).toBe(false)
  })
})
