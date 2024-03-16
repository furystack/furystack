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
      'ExampleNumberEvent' | 'ExampleStringEvent',
      { ExampleNumberEvent: number; ExampleStringEvent: string }
    >()
    const numberListener = vi.fn((val: number) => {
      console.log(val)
    })

    const stringListener = vi.fn((val: string) => {
      console.log(val)
    })

    // Act
    eventHub.addListener('ExampleNumberEvent', numberListener)
    eventHub.emit('ExampleNumberEvent', 1)

    eventHub.addListener('ExampleStringEvent', stringListener)
    eventHub.emit('ExampleStringEvent', '1')

    // Assert
    expect(numberListener).toBeCalledWith(1)
    expect(numberListener).toBeCalledTimes(1)

    expect(stringListener).toBeCalledWith('1')
    expect(stringListener).toBeCalledTimes(1)
  })
})
