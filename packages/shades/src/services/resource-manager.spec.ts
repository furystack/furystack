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

  it('Should switch to a new observable when a different reference is passed for the same key', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o1 = new ObservableValue(1)
      const o2 = new ObservableValue(42)
      const onChange = vi.fn()

      const [value1] = rm.useObservable('test', o1, onChange)
      expect(value1).toBe(1)
      expect(o1.getObservers().length).toBe(1)

      const [value2] = rm.useObservable('test', o2, onChange)
      expect(value2).toBe(42)
      expect(o1.getObservers().length).toBe(0)
      expect(o2.getObservers().length).toBe(1)
    })
  })

  it('Should subscribe with the new onChange callback when switching observables', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o1 = new ObservableValue('a')
      const o2 = new ObservableValue('x')
      const onChange1 = vi.fn()
      const onChange2 = vi.fn()

      rm.useObservable('test', o1, onChange1)
      rm.useObservable('test', o2, onChange2)

      o2.setValue('y')
      expect(onChange2).toHaveBeenCalledWith('y')
      expect(onChange1).not.toHaveBeenCalled()
    })
  })

  it('Should not re-subscribe when the same observable reference is passed', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o = new ObservableValue(1)
      const onChange = vi.fn()

      rm.useObservable('test', o, onChange)
      rm.useObservable('test', o, onChange)
      rm.useObservable('test', o, onChange)

      expect(o.getObservers().length).toBe(1)
    })
  })

  it('Should return a setValue bound to the new observable after switching', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o1 = new ObservableValue(1)
      const o2 = new ObservableValue(10)
      const onChange = vi.fn()

      const [, setValue1] = rm.useObservable('test', o1, onChange)
      setValue1(5)
      expect(o1.getValue()).toBe(5)

      const [, setValue2] = rm.useObservable('test', o2, onChange)
      setValue2(99)
      expect(o2.getValue()).toBe(99)
      expect(o1.getValue()).toBe(5)
    })
  })

  it('Should handle multiple sequential observable switches for the same key', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o1 = new ObservableValue('a')
      const o2 = new ObservableValue('b')
      const o3 = new ObservableValue('c')
      const onChange = vi.fn()

      const [v1] = rm.useObservable('test', o1, onChange)
      expect(v1).toBe('a')

      const [v2] = rm.useObservable('test', o2, onChange)
      expect(v2).toBe('b')
      expect(o1.getObservers().length).toBe(0)

      const [v3] = rm.useObservable('test', o3, onChange)
      expect(v3).toBe('c')
      expect(o2.getObservers().length).toBe(0)
      expect(o3.getObservers().length).toBe(1)
    })
  })

  it('Should not trigger callbacks on the old observable after switching', async () => {
    await usingAsync(new ResourceManager(), async (rm) => {
      const o1 = new ObservableValue(1)
      const o2 = new ObservableValue(2)
      const onChange = vi.fn()

      rm.useObservable('test', o1, onChange)
      rm.useObservable('test', o2, onChange)

      onChange.mockClear()
      o1.setValue(999)
      expect(onChange).not.toHaveBeenCalled()

      o2.setValue(100)
      expect(onChange).toHaveBeenCalledWith(100)
    })
  })

  it('Should clean up switched observers on dispose', async () => {
    const o1 = new ObservableValue(1)
    const o2 = new ObservableValue(2)
    const onChange = vi.fn()

    await usingAsync(new ResourceManager(), async (rm) => {
      rm.useObservable('test', o1, onChange)
      rm.useObservable('test', o2, onChange)
      expect(o2.getObservers().length).toBe(1)
    })

    expect(o2.getObservers().length).toBe(0)
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

  it('Should silently ignore useState setter calls after disposal', async () => {
    let setValueFn: (value: number) => void

    await usingAsync(new ResourceManager(), async (rm) => {
      const [, setValue] = rm.useState<number>('count', 0, vi.fn())
      setValueFn = setValue
    })

    // After disposal, calling the setter should not throw
    expect(() => setValueFn!(42)).not.toThrow()
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
