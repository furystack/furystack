import { InProcessCrossNodeBus, MemoryBroker, ReplayWindowExceededError } from '@furystack/cross-node-bus'
import { describe, expect, it } from 'vitest'
import { createBusBackedChangeLog } from './change-log.js'
import { EntityChangeBus } from './entity-change-bus.js'
import { createInjector } from '@furystack/inject'

const collect = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const out: T[] = []
  for await (const value of iterable) out.push(value)
  return out
}

describe('ChangeLog (bus-backed)', () => {
  describe('oldestSeq', () => {
    it('returns undefined when nothing has been published', () => {
      using bus = new InProcessCrossNodeBus()
      const log = createBusBackedChangeLog(bus)
      expect(log.oldestSeq('User')).toBeUndefined()
    })

    it('returns the lowest retained seq', async () => {
      using bus = new InProcessCrossNodeBus()
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      await bus.publish('entity/User', { type: 'added', entity: { id: 2 }, primaryKey: 2 })
      expect(log.oldestSeq('User')).toBe('1')
    })

    it('advances after the bus ring buffer evicts older entries', async () => {
      using broker = new MemoryBroker({ replayWindow: 1 })
      using bus = new InProcessCrossNodeBus({ broker })
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      await bus.publish('entity/User', { type: 'added', entity: { id: 2 }, primaryKey: 2 })
      expect(log.oldestSeq('User')).toBe('2')
    })
  })

  describe('since', () => {
    it('yields entries strictly greater than fromSeq, in publish order', async () => {
      using bus = new InProcessCrossNodeBus()
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      await bus.publish('entity/User', { type: 'updated', id: 1, change: { name: 'Alice' } })
      await bus.publish('entity/User', { type: 'removed', id: 1 })

      const out = await collect(log.since('User', '1'))
      expect(out.map((e) => e.version.seq)).toEqual(['2', '3'])
      expect(out[0].type).toBe('updated')
      expect(out[1].type).toBe('removed')
    })

    it('yields nothing when no entries are newer than fromSeq', async () => {
      using bus = new InProcessCrossNodeBus()
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      const out = await collect(log.since('User', '1'))
      expect(out).toEqual([])
    })

    it('throws ReplayWindowExceededError when fromSeq is older than the retained window', async () => {
      using broker = new MemoryBroker({ replayWindow: 1 })
      using bus = new InProcessCrossNodeBus({ broker })
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      await bus.publish('entity/User', { type: 'added', entity: { id: 2 }, primaryKey: 2 })
      expect(() => log.since('User', '0')).toThrow(ReplayWindowExceededError)
    })

    it('skips messages whose payload is not a recognised EntityChange shape', async () => {
      using bus = new InProcessCrossNodeBus()
      const log = createBusBackedChangeLog(bus)
      await bus.publish('entity/User', { type: 'added', entity: { id: 1 }, primaryKey: 1 })
      await bus.publish('entity/User', { type: 'unknown' })
      const out = await collect(log.since('User', '0'))
      expect(out.map((e) => e.version.seq)).toEqual(['1'])
    })
  })

  describe('integration with EntityChangeBus', () => {
    it('reads back what the facade published, in order, with stamped versions', async () => {
      await using injector = createInjector()
      const bus = injector.get(EntityChangeBus)
      await bus.publish('User', { type: 'added', entity: { id: 'a' }, primaryKey: 'a' })
      await bus.publish('User', { type: 'updated', id: 'a', change: { name: 'A' } })
      const log = createBusBackedChangeLog(bus.bus)
      const out = await collect(log.since('User', '0'))
      expect(out).toHaveLength(2)
      expect(out[0].type).toBe('added')
      expect(out[1].type).toBe('updated')
      expect(out[1].version.seq).toBe('2')
    })
  })
})
