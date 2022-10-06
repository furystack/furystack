import { Trace } from './trace'
import { describe, expect, it } from 'vitest'

class MockClass {
  constructor(private testValue?: string) {}

  public testError(msg: string) {
    throw Error(msg)
  }

  public testScope() {
    return this.testValue
  }

  public static addStatic(...args: number[]) {
    return args.reduce((a, b) => a + b, 0)
  }

  public addInstance(...args: number[]) {
    return args.reduce((a, b) => a + b, 0)
  }

  public async addInstanceAsync(...args: number[]): Promise<number> {
    return args.reduce((a, b) => a + b, 0)
  }

  public async testErrorAsync(msg: string): Promise<number> {
    throw Error(msg)
  }
}

export const traceTests = describe('Trace tests', () => {
  describe('Static method traces', () => {
    it('Static Methods call should be traced with args', async () => {
      await new Promise<void>((resolve) => {
        const args = [1, 2, 3]
        const observer = Trace.method({
          object: MockClass,
          method: MockClass.addStatic,
          onCalled: (traceData) => {
            expect(args).toEqual(traceData.methodArguments)
            observer.dispose()
            resolve()
          },
        })

        MockClass.addStatic(...args)
      })
    })

    it('Static Methods call should be traced with args and return value', async () => {
      await new Promise<void>((resolve) => {
        const args = [1, 2, 3]
        const observer = Trace.method({
          object: MockClass,
          method: MockClass.addStatic,
          onFinished: (traceData) => {
            expect(args).toEqual(traceData.methodArguments)
            expect(traceData.returned).toBe(1 + 2 + 3)
            observer.dispose()
            resolve()
          },
        })
        MockClass.addStatic(...args)
      })
    })

    it("shouldn't be triggered after observer is disposed", async () => {
      await new Promise<void>((resolve, reject) => {
        const args = [1, 2, 3]
        const observer = Trace.method({
          object: MockClass,
          method: MockClass.addStatic,
          onCalled: () => {
            reject(new Error("Shouldn't be triggered here"))
          },
        })
        const observer2 = Trace.method({
          object: MockClass,
          method: MockClass.addStatic,
          onCalled: () => {
            observer2.dispose()
            resolve()
          },
        })
        observer.dispose()
        const returned = MockClass.addStatic(...args)
        expect(returned).toEqual(1 + 2 + 3)
      })
    })
  })

  describe('Instance method traces', () => {
    it('should be traced with arguments', async () => {
      await new Promise<void>((resolve) => {
        const instance = new MockClass()
        const args = [1, 2, 3]
        const observer = Trace.method({
          object: instance,
          method: instance.addInstance,
          onFinished: (traceData) => {
            expect(args).toEqual(traceData.methodArguments)
            expect(traceData.returned).toBe(1 + 2 + 3)
            observer.dispose()
            resolve()
          },
        })
        instance.addInstance(...args)
      })
    })

    it('should be traced asynchronously', async () => {
      await new Promise<void>((resolve) => {
        const instance = new MockClass()
        const args = [1, 2, 3]
        const observer = Trace.method({
          object: instance,
          method: instance.addInstanceAsync,
          isAsync: true,
          onFinished: (traceData) => {
            expect(args).toEqual(traceData.methodArguments)
            const { returned } = traceData
            expect(returned).toBe(1 + 2 + 3)
            observer.dispose()
            resolve()
          },
        })
        instance.addInstanceAsync(...args)
      })
    })

    it("should have a valid 'this' scope", async () => {
      await new Promise<void>((resolve) => {
        const instance = new MockClass('testValue')
        const observer = Trace.method({
          object: instance,
          method: instance.testScope,
          onFinished: (traceData) => {
            if (traceData.returned) {
              expect(traceData.returned).toBe('testValue')
              observer.dispose()
              resolve()
            }
          },
        })
        expect(instance.testScope()).toBe('testValue')
      })
    })

    it('should handle throwing errors', async () => {
      await new Promise<void>((resolve) => {
        const instance = new MockClass('testValue')
        const observer = Trace.method({
          object: instance,
          method: instance.testError,
          onError: (traceData) => {
            if (traceData.error) {
              expect(traceData.error.message).toBe('message')
              observer.dispose()
              resolve()
            }
          },
        })
        expect(() => {
          instance.testError('message')
        }).toThrow()
      })
    })

    it('should handle throwing errors with asyncs', async () => {
      await new Promise<void>((resolve, reject) => {
        const instance = new MockClass('testValue')
        const observer = Trace.method({
          object: instance,
          method: instance.testErrorAsync,
          isAsync: true,
          onError: (traceData) => {
            if (traceData.error) {
              expect(traceData.error.message).toBe('message')
              observer.dispose()
              resolve()
            }
          },
        })
        instance
          .testErrorAsync('message')
          .then(() => {
            reject('Should throw error')
          })
          .catch(() => {
            /** ignore, done handled in the onError callback */
          })
      })
    })
  })
})
