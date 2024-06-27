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
})
