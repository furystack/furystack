import { describe, expect, it, vi } from 'vitest'
import { using } from './using.js'

export class MockDisposable implements Disposable {
  private disposed = false
  public isDisposed = () => this.disposed
  /**
   * Disposes the MockDisposable instance, calls the dispose callback
   */
  public [Symbol.dispose]() {
    this.disposed = true
    this.disposeCallback && this.disposeCallback()
  }

  /**
   * Mock to throw an error
   */
  public whooops() {
    throw Error('Whooops')
  }

  /**
   * Defines the callback that will be called on dispose
   */
  public disposeCallback!: () => void
}

describe('Using', () => {
  it('Can be constructed', () => {
    using(new MockDisposable(), (d) => {
      expect(d).toBeInstanceOf(MockDisposable)
    })
  })

  it('Should return a value from a callback', () => {
    const returned = using(new MockDisposable(), () => {
      return 1
    })
    expect(returned).toBe(1)
  })

  describe('isDisposed', () => {
    it('should return a correct value before and after disposition', () => {
      const d = new MockDisposable()
      expect(d.isDisposed()).toBe(false)
      d[Symbol.dispose]()
      expect(d.isDisposed()).toBe(true)
    })
  })

  describe('dispose()', () => {
    it('should be called on error', () => {
      const callbackMethod = vi.fn()
      try {
        using(new MockDisposable(), (d) => {
          d.disposeCallback = () => {
            callbackMethod()
          }
          d.whooops()
        })
      } catch {
        /** ignore */
      }
      expect(callbackMethod).toBeCalled()
    })
  })
})
