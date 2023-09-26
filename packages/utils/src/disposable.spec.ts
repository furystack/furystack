import { describe, it, expect, vi } from 'vitest'
import type { Disposable } from './disposable.js'
import { using, usingAsync } from './disposable.js'

export class MockDisposable implements Disposable {
  private disposed = false
  public isDisposed = () => this.disposed
  /**
   * Disposes the MockDisposable instance, calls the dispose callback
   */
  public dispose = () => {
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

/**
 * Unit tests for disposables
 */
export const disposableTests = describe('Disposable', () => {
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

  it('Should return a value from an async callback', async () => {
    const returned = await usingAsync(new MockDisposable(), async () => {
      return 2
    })
    expect(returned).toBe(2)
  })

  describe('isDisposed', () => {
    it('should return a correct value before and after disposition', () => {
      const d = new MockDisposable()
      expect(d.isDisposed()).toBe(false)
      d.dispose()
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

    it('should be called with usingAsync()', async () => {
      const callbackMethod = vi.fn()
      await usingAsync(new MockDisposable(), async (d) => {
        d.disposeCallback = () => {
          callbackMethod()
        }
        return new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      })
      expect(callbackMethod).toBeCalled()
    })

    it('should be called when async fails', async () => {
      const callbackMethod = vi.fn()
      try {
        await usingAsync(new MockDisposable(), async (d) => {
          d.disposeCallback = () => {
            callbackMethod()
          }
          return new Promise((_resolve, reject) => {
            setTimeout(reject, 1)
          })
        })
      } catch (error) {
        /** ignore */
      }
      expect(callbackMethod).toBeCalled()
    })

    it('should await dispose for asyncs with usingAsync()', async () => {
      class AsyncDispose {
        /** flag */
        public isDisposed = false
        /** set isDisposed with a timeout */
        public async dispose() {
          await new Promise<void>((resolve) =>
            setTimeout(() => {
              this.isDisposed = true
              resolve()
            }, 10),
          )
        }
      }

      const asyncDispose = new AsyncDispose()
      await usingAsync(asyncDispose, async () => {
        /** */
      })
      expect(asyncDispose.isDisposed).toBe(true)
    })
  })
})
