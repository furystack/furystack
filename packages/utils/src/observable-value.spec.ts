import { ObservableValue } from './observable-value'
import { describe, expect, it } from 'vitest'

/**
 * Observable Value tests
 */
export const observableTests = describe('Observable', () => {
  it('should be constructed without initial value', async () => {
    const v = new ObservableValue()
    await new Promise<void>((resolve) => {
      v.subscribe(() => {
        expect(v.getValue()).toBe(undefined)
        resolve()
      }, true)
      expect(v).toBeInstanceOf(ObservableValue)
    })
  })

  it('should be constructed with initial value', async () => {
    await new Promise<void>((resolve) => {
      const v = new ObservableValue(1)
      v.subscribe(() => {
        expect(v.getValue()).toBe(1)
        resolve()
      }, true)
    })
  })

  describe('Subscription callback', () => {
    it('should be triggered only when a value is changed', async () => {
      await new Promise<void>((resolve) => {
        const v = new ObservableValue(1)
        v.subscribe(() => {
          expect(v.getValue()).toBe(2)
          resolve()
        }, false)
        v.setValue(1)
        v.setValue(1)
        v.setValue(2)
      })
    })

    it('should be triggered only on change when getLast is false', async () => {
      await new Promise<void>((resolve) => {
        const v = new ObservableValue(1)
        v.subscribe((value) => {
          expect(value).toBe(2)
          resolve()
        }, false)
        v.setValue(2)
      })
    })
  })

  describe('Unsubscribe', () => {
    it('should remove the subscription on unsubscribe()', async () => {
      await new Promise<void>((resolve, reject) => {
        const callback1 = () => {
          reject(Error('Shouldnt be triggered'))
        }

        const callback2 = (value: number) => {
          expect(value).toBe(2)
          resolve()
        }
        const v = new ObservableValue(1)
        const observer1 = v.subscribe(callback1)
        v.subscribe(callback2)

        v.unsubscribe(observer1)
        v.setValue(2)
      })
    })

    it('should remove the subscription on Observable dispose', () => {
      const callback1 = () => {
        /** */
      }
      const callback2 = () => {
        /** */
      }
      const v = new ObservableValue(1)
      v.subscribe(callback1)
      v.subscribe(callback2)
      expect(v.getObservers().length).toBe(2)
      v.dispose()
      expect(v.getObservers().length).toBe(0)
    })

    it('should remove the subscription on Observer dispose', () => {
      const callback1 = () => {
        /** */
      }
      const v = new ObservableValue(1)
      const observer = v.subscribe(callback1)
      expect(v.getObservers().length).toBe(1)
      observer.dispose()
      expect(v.getObservers().length).toBe(0)
    })

    it('should throw an error for setValue() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v.dispose()
      expect(() => v.setValue(3)).toThrowError('Observable already disposed')
    })

    it('should throw an error for setValue() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v.dispose()
      expect(() => v.getValue()).toThrowError('Observable already disposed')
    })

    it('should remove the subscription only from the disposed Observer', async () => {
      await new Promise<void>((resolve) => {
        class Alma {
          public Callback() {
            resolve()
          }
        }
        const v = new ObservableValue(1)
        const observer = v.subscribe(new Alma().Callback)
        v.subscribe(new Alma().Callback)
        expect(v.getObservers().length).toBe(2)
        observer.dispose()
        expect(v.getObservers().length).toBe(1)
        v.setValue(3)
      })
    })
  })
})
