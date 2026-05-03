import { describe, expect, it, vi } from 'vitest'
import type { BusMessage } from '../types.js'
import { createInProcessBusNetwork } from './create-in-process-bus-network.js'

describe('createInProcessBusNetwork', () => {
  it('mints `count` buses sharing one broker', async () => {
    using network = createInProcessBusNetwork({ count: 3 })
    expect(network.buses).toHaveLength(3)
    expect(network.broker).toBeDefined()

    const handlerB = vi.fn()
    const handlerC = vi.fn()
    using _subB = network.buses[1].subscribe('topic', handlerB)
    using _subC = network.buses[2].subscribe('topic', handlerC)

    await network.buses[0].publish('topic', { from: 0 })

    expect(handlerB).toHaveBeenCalledTimes(1)
    expect(handlerC).toHaveBeenCalledTimes(1)
  })

  it('honors per-bus topicPrefixes for multi-service simulation', async () => {
    using network = createInProcessBusNetwork({
      count: 2,
      topicPrefixes: ['svc-a/', 'svc-b/'],
    })
    const [busA, busB] = network.buses
    const onB = vi.fn()
    const eavesdrop = vi.fn()

    using _subB = busB.subscribe('events', onB)
    using _foreign = busB.subscribeForeign('svc-a/', 'events', eavesdrop)

    await busA.publish('events', { from: 'a' })

    expect(onB).not.toHaveBeenCalled()
    expect(eavesdrop).toHaveBeenCalledTimes(1)
    expect((eavesdrop.mock.calls[0]?.[0] as BusMessage).originId).toBe(busA.nodeId)
  })

  it('honors per-bus nodeIds', () => {
    using network = createInProcessBusNetwork({
      count: 2,
      nodeIds: ['alice', 'bob'],
    })
    expect(network.buses[0].nodeId).toBe('alice')
    expect(network.buses[1].nodeId).toBe('bob')
  })

  it('disposes every bus and the broker on teardown', () => {
    const network = createInProcessBusNetwork({ count: 2 })
    network[Symbol.dispose]()
    for (const bus of network.buses) {
      expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
    }
    expect(() => network.broker.publish('topic', 'a', null)).toThrow(/disposed/)
  })

  describe('input validation', () => {
    it('rejects non-positive count', () => {
      expect(() => createInProcessBusNetwork({ count: 0 })).toThrow(RangeError)
      expect(() => createInProcessBusNetwork({ count: 1.5 })).toThrow(RangeError)
    })

    it('rejects mismatched topicPrefixes length', () => {
      expect(() => createInProcessBusNetwork({ count: 2, topicPrefixes: ['only-one/'] })).toThrow(RangeError)
    })

    it('rejects mismatched nodeIds length', () => {
      expect(() => createInProcessBusNetwork({ count: 2, nodeIds: ['only-one'] })).toThrow(RangeError)
    })
  })
})
