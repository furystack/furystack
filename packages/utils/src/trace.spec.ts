import { describe, expect, it, vi } from 'vitest'
import { Trace } from './trace.js'

class MockClass {
  constructor(private testValue?: string) {}

  public testError(msg: string) {
    throw Error(msg)
  }

  public testScope() {
    return this.testValue
  }

  public static addStatic(this: void, ...args: number[]) {
    return args.reduce((a, b) => a + b, 0)
  }

  public addInstance(this: void, ...args: number[]) {
    return args.reduce((a, b) => a + b, 0)
  }

  public async addInstanceAsync(this: void, ...args: number[]): Promise<number> {
    return args.reduce((a, b) => a + b, 0)
  }

  public async testErrorAsync(msg: string): Promise<number> {
    throw Error(msg)
  }
}

export const traceTests = describe('Trace tests', () => {
  describe('Static method traces', () => {
    it('Static Methods call should be traced with args', () => {
      const args = [1, 2, 3]
      const doneCallback = vi.fn()
      const observer = Trace.method({
        object: MockClass,
        method: MockClass.addStatic,
        onCalled: (traceData) => {
          expect(args).toEqual(traceData.methodArguments)
          observer[Symbol.dispose]()
          doneCallback()
        },
      })
      MockClass.addStatic(...args)
      expect(doneCallback).toBeCalled()
    })

    it('Static Methods call should be traced with args and return value', () => {
      const args = [1, 2, 3]
      const doneCallback = vi.fn()
      const observer = Trace.method({
        object: MockClass,
        method: MockClass.addStatic,
        onFinished: (traceData) => {
          expect(args).toEqual(traceData.methodArguments)
          expect(traceData.returned).toBe(1 + 2 + 3)
          observer[Symbol.dispose]()
          doneCallback()
        },
      })
      MockClass.addStatic(...args)
      expect(doneCallback).toBeCalled()
    })

    it("shouldn't be triggered after observer is disposed", () => {
      const args = [1, 2, 3]
      const shouldNotCall = vi.fn()
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: MockClass,
        method: MockClass.addStatic,
        onCalled: () => {
          shouldNotCall("Shouldn't be triggered here")
        },
      })
      const observer2 = Trace.method({
        object: MockClass,
        method: MockClass.addStatic,
        onCalled: () => {
          observer2[Symbol.dispose]()
          doneCallback()
        },
      })
      observer[Symbol.dispose]()
      const returned = MockClass.addStatic(...args)
      expect(returned).toEqual(1 + 2 + 3)
      expect(doneCallback).toBeCalled()
      expect(shouldNotCall).not.toBeCalled()
    })
  })

  describe('Instance method traces', () => {
    it('should be traced with arguments', () => {
      const instance = new MockClass()
      const args = [1, 2, 3]
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: instance,
        method: instance.addInstance,
        onFinished: (traceData) => {
          expect(args).toEqual(traceData.methodArguments)
          expect(traceData.returned).toBe(1 + 2 + 3)
          observer[Symbol.dispose]()
          doneCallback()
        },
      })
      instance.addInstance(...args)
      expect(doneCallback).toBeCalled()
    })

    it('should be traced asynchronously', async () => {
      const instance = new MockClass()
      const args = [1, 2, 3]
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: instance,
        method: instance.addInstanceAsync,
        isAsync: true,
        onFinished: (traceData) => {
          expect(args).toEqual(traceData.methodArguments)
          const { returned } = traceData
          expect(returned).toBe(1 + 2 + 3)
          observer[Symbol.dispose]()
          doneCallback()
        },
      })
      await instance.addInstanceAsync(...args)
      expect(doneCallback).toBeCalled()
    })

    it("should have a valid 'this' scope", () => {
      const instance = new MockClass('testValue')
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: instance,
        method: instance.testScope,
        onFinished: (traceData) => {
          if (traceData.returned) {
            expect(traceData.returned).toBe('testValue')
            observer[Symbol.dispose]()
            doneCallback()
          }
        },
      })
      expect(instance.testScope()).toBe('testValue')
      expect(doneCallback).toBeCalled()
    })

    it('should handle throwing errors', () => {
      const instance = new MockClass('testValue')
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: instance,
        method: instance.testError,
        onError: (traceData) => {
          if (traceData.error) {
            expect(traceData.error.message).toBe('message')
            observer[Symbol.dispose]()
            doneCallback()
          }
        },
      })
      expect(() => {
        instance.testError('message')
      }).toThrow()
      expect(doneCallback).toBeCalled()
    })

    it('should handle throwing errors with asyncs', async () => {
      const instance = new MockClass('testValue')
      const doneCallback = vi.fn()

      const observer = Trace.method({
        object: instance,
        method: instance.testErrorAsync,
        isAsync: true,
        onError: (traceData) => {
          if (traceData.error) {
            expect(traceData.error.message).toBe('message')
            observer[Symbol.dispose]()
            doneCallback()
          }
        },
      })
      try {
        await instance.testErrorAsync('message')
      } catch (error) {
        // ignore
      }
      expect(doneCallback).toBeCalled()
    })
  })
})
