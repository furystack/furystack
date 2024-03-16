import { EventHub } from './event-hub.js'
import { describe, expect, it, vi } from 'vitest'

describe('EventHub', () => {
  it('Should fail on type errors', () => {
    const eventHub = new EventHub<
      'ExampleNumberEvent' | 'ExampleStringEvent',
      { ExampleNumberEvent: number; ExampleStringEvent: string }
    >()
    const numberListener = vi.fn((val: number) => {
      console.log(val)
    })
    const stringListener = vi.fn((val: string) => {
      console.log(val)
    })
    // @ts-expect-error Type 'string' is not assignable to type 'number'
    eventHub.addListener('ExampleNumberEvent', stringListener)
    // @ts-expect-error Type 'string' is not assignable to type 'number'
    eventHub.emit('ExampleNumberEvent', '1')

    // @ts-expect-error Type 'number' is not assignable to type 'string'
    eventHub.addListener('ExampleStringEvent', numberListener)
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    eventHub.emit('ExampleStringEvent', 1)
  })

  it('should add listener', () => {
    // Arrange
    const eventHub = new EventHub<
      'ExampleNumberEvent' | 'ExampleStringEvent' | 'ExampleObjectEvent1' | 'ExampleObjectEvent2',
      {
        ExampleNumberEvent: number
        ExampleStringEvent: string
        ExampleObjectEvent1: { a: number }
        ExampleObjectEvent2: { b: string }
      }
    >()
    const numberListener = vi.fn((val: number) => {
      console.log(val)
    })

    const stringListener = vi.fn((val: string) => {
      console.log(val)
    })

    const objectListener1 = vi.fn((val: { a: number }) => {
      console.log(val)
    })

    const objectListener2 = vi.fn((val: { b: string }) => {
      console.log(val)
    })

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
})
