import { describe, expect, it, vi } from 'vitest'
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

    it('should be triggered only on change in async manner', () => {
      const v = new ObservableValue(1)
      const doneCallback = vi.fn()

      v.subscribe(async (value) => {
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
      v[Symbol.dispose]()
      expect(v.getObservers().length).toBe(0)

      expect(v.isDisposed).toBe(true)
    })

    it('should remove the subscription on Observer dispose', () => {
      const callback1 = () => {
        /** */
      }
      const v = new ObservableValue(1)
      const observer = v.subscribe(callback1)
      expect(v.getObservers().length).toBe(1)
      observer[Symbol.dispose]()
      expect(v.getObservers().length).toBe(0)
    })

    it('should throw an error for setValue() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v[Symbol.dispose]()
      expect(() => v.setValue(3)).toThrowError('Observable already disposed')
    })

    it('should throw an error for getValue() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v[Symbol.dispose]()
      expect(() => v.getValue()).toThrowError('Observable already disposed')
    })

    it('should throw an error for subscribe() when the observer has been disposed', () => {
      const v = new ObservableValue(1)
      v[Symbol.dispose]()
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
      const observer = v.subscribe(() => new Alma().Callback())
      v.subscribe(() => new Alma().Callback())
      expect(v.getObservers().length).toBe(2)
      observer[Symbol.dispose]()
      expect(v.getObservers().length).toBe(1)
      v.setValue(3)

      expect(doneCallback).toBeCalledTimes(1)
    })
  })

  describe('Custom Compare function', () => {
    it('Should compare the values with the custom compare function', () => {
      const v = new ObservableValue(
        { value: 2 },
        {
          compare: (a, b) => a.value !== b.value,
        },
      )
      const onChange = vi.fn()
      v.subscribe(onChange)

      v.setValue({ value: 2 })
      expect(v.getValue()).toEqual({ value: 2 })
      expect(onChange).not.toBeCalled()

      v.setValue({ value: 3 })
      expect(v.getValue()).toEqual({ value: 3 })
      expect(onChange).toBeCalledTimes(1)
      expect(onChange).toBeCalledWith({ value: 3 })

      v.setValue({ value: 3 })
      expect(v.getValue()).toEqual({ value: 3 })
      expect(onChange).toBeCalledTimes(1)
    })
  })

  describe('Filtered subscriptions', () => {
    it('should not trigger the callback if the filter returns false', () => {
      const v = new ObservableValue({ shouldNotify: true, value: 1 })
      const onChange = vi.fn()
      v.subscribe(onChange, {
        filter: (nextValue) => nextValue.shouldNotify,
      })

      v.setValue({ shouldNotify: false, value: 1 })
      expect(onChange).not.toBeCalled()

      v.setValue({ shouldNotify: false, value: 2 })
      expect(onChange).not.toBeCalled()
      expect(v.getValue()).toEqual({ shouldNotify: false, value: 2 })

      v.setValue({ shouldNotify: true, value: 3 })
      expect(onChange).toBeCalledTimes(1)
      expect(onChange).toBeCalledWith({ shouldNotify: true, value: 3 })
    })
  })
})
