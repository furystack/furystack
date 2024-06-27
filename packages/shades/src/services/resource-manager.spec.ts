import { ObservableValue, usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { ResourceManager } from './resource-manager.js'

describe('ResourceManager', () => {
  it('Should return an observable from cache', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o = new ObservableValue(1)
      const [value1] = rm.useObservable('test', o, () => {
        /** ignore */
      })
      const [value2] = rm.useObservable('test', o, () => {
        /** ignore */
      })

      expect(value1).toBe(value2)

      expect(o.getObservers().length).toBe(1)
    })
  })

  it('Should return a disposable from cache', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const factory = vi.fn(() => ({
        [Symbol.dispose]: () => {
          /** ignore */
        },
      }))
      const d1 = rm.useDisposable('test', factory)
      const d2 = rm.useDisposable('test', factory)

      expect(d1).toBe(d2)
      expect(factory).toHaveBeenCalledTimes(1)
    })
  })

  it('Should dispose all disposables on dispose', async () => {
    const disposable = {
      [Symbol.dispose]: vi.fn(),
    }
    const factory = vi.fn(() => disposable)
    await usingAsync(new ResourceManager(), async (rm) => {
      rm.useDisposable('test', factory)
      expect(factory).toHaveBeenCalledTimes(1)
    })

    expect(disposable[Symbol.dispose]).toHaveBeenCalledTimes(1)
  })

  it('Should dispose all async disposables on dispose', async () => {
    const disposable = {
      [Symbol.asyncDispose]: vi.fn(),
    }
    const factory = vi.fn(() => disposable)
    await usingAsync(new ResourceManager(), async (rm) => {
      rm.useDisposable('test', factory)
      expect(factory).toHaveBeenCalledTimes(1)
    })

    expect(disposable[Symbol.asyncDispose]).toHaveBeenCalledTimes(1)
  })

  it('Should throw an aggregated error when failed to dispose something', async () => {
    const disposable = {
      [Symbol.dispose]: vi.fn(() => {
        throw new Error('Failed to dispose')
      }),
    }
    const factory = vi.fn(() => disposable)
    await expect(
      async () =>
        await usingAsync(new ResourceManager(), async (rm) => {
          rm.useDisposable('test', factory)
          expect(factory).toHaveBeenCalledTimes(1)
        }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: There was an error during disposing 1 stores: Error: Failed to dispose]`,
    )

    expect(disposable[Symbol.dispose]).toHaveBeenCalledTimes(1)
  })

  it('Should throw an aggregated error when failed to async dispose something', async () => {
    const disposable = {
      [Symbol.asyncDispose]: vi.fn(async () => {
        throw new Error('Failed to dispose')
      }),
    }
    const factory = vi.fn(() => disposable)
    await expect(
      async () =>
        await usingAsync(new ResourceManager(), async (rm) => {
          rm.useDisposable('test', factory)
          expect(factory).toHaveBeenCalledTimes(1)
        }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: There was an error during disposing 1 stores: Error: Failed to dispose]`,
    )

    expect(disposable[Symbol.asyncDispose]).toHaveBeenCalledTimes(1)
  })
})
