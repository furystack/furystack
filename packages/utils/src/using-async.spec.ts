import { describe, expect, it, vi } from 'vitest'
import { usingAsync } from './using-async.js'
import { MockDisposable } from './using.spec.js'

export class MockAsyncDisposable implements AsyncDisposable {
  private disposed = false
  public isDisposed = () => this.disposed
  /**
   * Disposes the MockDisposable instance, calls the dispose callback
   */
  public async [Symbol.asyncDispose]() {
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
describe('usingAsync()', () => {
  it('dispose should be called with usingAsync()', async () => {
    const callbackMethod = vi.fn()
    await usingAsync(new MockAsyncDisposable(), async (d) => {
      d.disposeCallback = () => {
        callbackMethod()
      }
      return new Promise((resolve) => {
        setTimeout(resolve, 1)
      })
    })
    expect(callbackMethod).toBeCalled()
  })

  it('dispose should be called when async fails', async () => {
    const callbackMethod = vi.fn()
    try {
      await usingAsync(new MockAsyncDisposable(), async (d) => {
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
    class AsyncDispose implements AsyncDisposable {
      /** flag */
      public isDisposed = false
      /** set isDisposed with a timeout */
      public async [Symbol.asyncDispose]() {
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

  it('Should dispose a non-async disposable object as well', async () => {
    const createdResource = await usingAsync(new MockDisposable(), async (mock) => {
      expect(mock).toBeInstanceOf(MockDisposable)
      return mock
    })

    expect(createdResource.isDisposed()).toBe(true)
  })
})
