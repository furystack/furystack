import { describe, it, expect, vi } from 'vitest'
import { ObservableValue } from './observable-value.js'

/**
 * Observable Value tests
 */
export const observableTests = describe('Observable', () => {
  it('should be constructed with an undefined initial value', () => {
    const v = new ObservableValue(undefined)
    expect(v).toBeInstanceOf(ObservableValue)
    expect(v.getValue()).toBe(undefined)
  })

  it('should be constructed with initial value', () => {
    const v = new ObservableValue(1)
    expect(v.getValue()).toBe(1)
  })

  describe('Subscription callback', () => {
    it('should be triggered only when a value is changed', () => {
      const v = new ObservableValue(1)
      const doneCallback = vi.fn()

      v.subscribe(() => {
        expect(v.getValue()).toBe(2)
        doneCallback()
      })
      v.setValue(1)
      v.setValue(1)
      v.setValue(2)
      expect(doneCallback).toBeCalledTimes(1)
    })

    it('should be triggered only on change', () => {
      const v = new ObservableValue(1)
      const doneCallback = vi.fn()

      v.subscribe((value) => {
        expect(value).toBe(2)
        doneCallback()
      })
      v.setValue(2)
      expect(doneCallback).toBeCalledTimes(1)
    })
  })

  describe('Unsubscribe', () => {
    it('should remove the subscription on unsubscribe()', () => {
      const shouldNotCall = vi.fn()

      const doneCallback = vi.fn((value: number) => {
        expect(value).toBe(2)
      })

      const v = new ObservableValue(1)
      const observer1 = v.subscribe(shouldNotCall)
      v.subscribe(doneCallback)

      v.unsubscribe(observer1)
      v.setValue(2)

      expect(doneCallback).toBeCalledTimes(1)
      expect(shouldNotCall).not.toBeCalled()
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

    it('should throw an error for getValue() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v.dispose()
      expect(() => v.getValue()).toThrowError('Observable already disposed')
    })

    it('should throw an error for subscribe() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v.dispose()
      expect(() =>
        v.subscribe(() => {
          /** */
        }),
      ).toThrowError('Observable already disposed')
    })

    it('should remove the subscription only from the disposed Observer', () => {
      const doneCallback = vi.fn()

      class Alma {
        public Callback() {
          doneCallback()
        }
      }
      const v = new ObservableValue(1)
      const observer = v.subscribe(new Alma().Callback)
      v.subscribe(new Alma().Callback)
      expect(v.getObservers().length).toBe(2)
      observer.dispose()
      expect(v.getObservers().length).toBe(1)
      v.setValue(3)

      expect(doneCallback).toBeCalledTimes(1)
    })
  })
})
