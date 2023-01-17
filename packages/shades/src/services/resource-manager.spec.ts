import { ObservableValue, using } from '@furystack/utils'
import { ResourceManager } from './resource-manager'
describe('ResourceManager', () => {
  it('Should return an observable from cache', () => {
    using(new ResourceManager(), (rm) => {
      const o = new ObservableValue(1)
      const [value1, setValue1] = rm.useObservable('test', o, () => {
        /** ignore */
      })
      const [value2, setValue2] = rm.useObservable('test', o, () => {
        /** ignore */
      })

      expect(value1).toBe(value2)
      expect(setValue1).toBe(setValue2)
    })
  })

  it('Should return a disposable from cache', () => {
    using(new ResourceManager(), (rm) => {
      const d = {
        dispose: () => {
          /** ignore */
        },
      }
      const d1 = rm.useDisposable('test', () => d)
      const d2 = rm.useDisposable('test', () => d)

      expect(d1).toBe(d2)
    })
  })
})
