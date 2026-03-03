import { describe, expect, it, vi } from 'vitest'
import type { ListenerErrorPayload } from './event-hub.js'
import { EventHub } from './event-hub.js'
import { sleepAsync } from './sleep-async.js'

describe('EventHub', () => {
  it('Should fail on type errors', () => {
    const eventHub = new EventHub<{ ExampleNumberEvent: number; ExampleStringEvent: string }>()
    const numberListener = vi.fn((_val: number) => {})
    const stringListener = vi.fn((_val: string) => {})
    // @ts-expect-error Type 'string' is not assignable to type 'number'
    eventHub.addListener('ExampleNumberEvent', stringListener)
    // @ts-expect-error Type 'string' is not assignable to type 'number'
    eventHub.emit('ExampleNumberEvent', '1')

    // @ts-expect-error Type 'number' is not assignable to type 'string'
    eventHub.addListener('ExampleStringEvent', numberListener)
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    eventHub.emit('ExampleStringEvent', 1)
  })

  it('Should remove a listener', () => {
    // Arrange
    const eventHub = new EventHub<{ ExampleNumberEvent: number }>()
    const numberListener = vi.fn((_val: number) => {})

    // Act
    eventHub.addListener('ExampleNumberEvent', numberListener)
    eventHub.removeListener('ExampleNumberEvent', numberListener)
    eventHub.emit('ExampleNumberEvent', 1)

    // Assert
    expect(numberListener).not.toBeCalled()
  })

  it('should distribute events through listeners', () => {
    // Arrange
    const eventHub = new EventHub<{
      ExampleNumberEvent: number
      ExampleStringEvent: string
      ExampleObjectEvent1: { a: number }
      ExampleObjectEvent2: { b: string }
    }>()
    const numberListener = vi.fn((_val: number) => {})

    const stringListener = vi.fn((_val: string) => {})

    const objectListener1 = vi.fn((_val: { a: number }) => {})

    const objectListener2 = vi.fn(async (_val: { b: string }) => {})

    // Act
    eventHub.addListener('ExampleNumberEvent', numberListener)
    eventHub.emit('ExampleNumberEvent', 1)

    eventHub.addListener('ExampleStringEvent', stringListener)
    eventHub.emit('ExampleStringEvent', '1')

    eventHub.addListener('ExampleObjectEvent1', objectListener1)
    eventHub.emit('ExampleObjectEvent1', { a: 1 })

    eventHub.addListener('ExampleObjectEvent2', objectListener2)
    eventHub.emit('ExampleObjectEvent2', { b: '1' })

    // Assert
    expect(numberListener).toBeCalledWith(1)
    expect(numberListener).toBeCalledTimes(1)

    expect(stringListener).toBeCalledWith('1')
    expect(stringListener).toBeCalledTimes(1)

    expect(objectListener1).toBeCalledWith({ a: 1 })
    expect(objectListener1).toBeCalledTimes(1)

    expect(objectListener2).toBeCalledWith({ b: '1' })
    expect(objectListener2).toBeCalledTimes(1)
  })

  it('Should add and remove a listener with subscription', async () => {
    const eventHub = new EventHub<{ ExampleNumberEvent: number }>()
    const numberListener = vi.fn((_val: number) => {})

    const subscription = eventHub.subscribe('ExampleNumberEvent', numberListener)
    eventHub.emit('ExampleNumberEvent', 1)

    expect(numberListener).toBeCalledWith(1)
    subscription[Symbol.dispose]()
    eventHub.emit('ExampleNumberEvent', 2)
    expect(numberListener).toBeCalledTimes(1)
  })

  it('should clear all listeners on dispose', () => {
    const hub = new EventHub<{ test: string }>()

    const listener = vi.fn((_val: string) => {})

    hub.addListener('test', listener)
    hub[Symbol.dispose]()
    hub.emit('test', 'test')
    expect(listener).not.toBeCalled()
  })

  describe('Error resilience', () => {
    it('should catch sync throws from listeners and still notify other listeners', () => {
      const hub = new EventHub<{ test: number }>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const throwingListener = () => {
        throw new Error('listener error')
      }
      const goodListener = vi.fn()

      hub.addListener('test', throwingListener)
      hub.addListener('test', goodListener)

      hub.emit('test', 42)

      expect(goodListener).toBeCalledWith(42)
      expect(goodListener).toBeCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should catch async rejections from listeners', async () => {
      const hub = new EventHub<{ test: number }>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rejectingListener = async () => {
        throw new Error('async listener error')
      }

      hub.addListener('test', rejectingListener)
      hub.emit('test', 42)

      await sleepAsync(10)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled EventHub listener error', {
        event: 'test',
        error: expect.any(Error) as Error,
      })

      consoleErrorSpy.mockRestore()
    })

    it('should route sync errors to onListenerError listeners when registered', () => {
      const hub = new EventHub<{ test: number; onListenerError: ListenerErrorPayload }>()
      const errorHandler = vi.fn()

      hub.addListener('onListenerError', errorHandler)
      hub.addListener('test', () => {
        throw new Error('boom')
      })

      hub.emit('test', 1)

      expect(errorHandler).toBeCalledTimes(1)
      expect(errorHandler).toBeCalledWith({
        event: 'test',
        error: expect.any(Error) as Error,
      })
    })

    it('should route async rejections to onListenerError listeners when registered', async () => {
      const hub = new EventHub<{ test: number; onListenerError: ListenerErrorPayload }>()
      const errorHandler = vi.fn()

      hub.addListener('onListenerError', errorHandler)
      hub.addListener('test', async () => {
        throw new Error('async boom')
      })

      hub.emit('test', 1)
      await sleepAsync(10)

      expect(errorHandler).toBeCalledTimes(1)
      expect(errorHandler).toBeCalledWith({
        event: 'test',
        error: expect.any(Error) as Error,
      })
    })

    it('should fall back to console.error if onListenerError handler itself throws', () => {
      const hub = new EventHub<{ test: number; onListenerError: ListenerErrorPayload }>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      hub.addListener('onListenerError', () => {
        throw new Error('error handler also fails')
      })
      hub.addListener('test', () => {
        throw new Error('original error')
      })

      hub.emit('test', 1)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in onListenerError handler', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should go straight to console.error when onListenerError event itself has a failing listener', () => {
      const hub = new EventHub<{ onListenerError: ListenerErrorPayload }>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      hub.addListener('onListenerError', () => {
        throw new Error('meta error')
      })

      hub.emit('onListenerError', { event: 'test', error: new Error('original') })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in onListenerError handler', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should fall back to console.error when no onListenerError listeners are registered', () => {
      const hub = new EventHub<{ test: number }>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      hub.addListener('test', () => {
        throw new Error('no handler')
      })

      hub.emit('test', 1)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled EventHub listener error', {
        event: 'test',
        error: expect.any(Error) as Error,
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
