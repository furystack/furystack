import type { SyncChangeEntry } from '@furystack/entity-sync'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInProcessChangeLog } from './change-log.js'

const entryAt = (seq: number, isoOffsetMs = 0): SyncChangeEntry => ({
  type: 'added',
  entity: { id: seq },
  version: { seq, timestamp: new Date(Date.now() + isoOffsetMs).toISOString() },
})

describe('ChangeLog (in-process)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('configure', () => {
    it('throws on append before configure', () => {
      const log = createInProcessChangeLog()
      expect(() => log.append('User', entryAt(1))).toThrow(/not configured/)
    })

    it('is idempotent on re-configure (preserves existing entries)', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.append('User', entryAt(1))
      log.configure('User', 120_000)
      expect(log.length('User')).toBe(1)
    })
  })

  describe('append + length', () => {
    it('appends entries in order', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.append('User', entryAt(1))
      log.append('User', entryAt(2))
      log.append('User', entryAt(3))
      expect(log.length('User')).toBe(3)
    })

    it('returns 0 for an unknown model', () => {
      const log = createInProcessChangeLog()
      expect(log.length('Unknown')).toBe(0)
    })
  })

  describe('oldestSeq', () => {
    it('returns undefined when the log is empty', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      expect(log.oldestSeq('User')).toBeUndefined()
    })

    it('returns the lowest retained seq', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.append('User', entryAt(1))
      log.append('User', entryAt(2))
      expect(log.oldestSeq('User')).toBe(1)
    })

    it('returns undefined for an unknown model', () => {
      const log = createInProcessChangeLog()
      expect(log.oldestSeq('Unknown')).toBeUndefined()
    })
  })

  describe('since', () => {
    it('returns entries strictly greater than fromSeq, in append order', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.append('User', entryAt(1))
      log.append('User', entryAt(2))
      log.append('User', entryAt(3))
      const out = log.since('User', 1)
      expect(out.map((e) => e.version.seq)).toEqual([2, 3])
    })

    it('returns an empty array when no entries are newer than fromSeq', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.append('User', entryAt(1))
      expect(log.since('User', 1)).toEqual([])
    })

    it('returns an empty array for an unknown model', () => {
      const log = createInProcessChangeLog()
      expect(log.since('Unknown', 0)).toEqual([])
    })
  })

  describe('retention', () => {
    it('drops entries older than the retention window on append', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 1_000)
      log.append('User', entryAt(1))
      vi.setSystemTime(Date.now() + 1_500)
      log.append('User', entryAt(2))
      expect(log.length('User')).toBe(1)
      expect(log.oldestSeq('User')).toBe(2)
    })

    it('drops stale entries when querying via since', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 1_000)
      log.append('User', entryAt(1))
      vi.setSystemTime(Date.now() + 1_500)
      expect(log.since('User', 0)).toEqual([])
    })

    it('keeps entries indefinitely under a non-expiring retention window', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60 * 60 * 1_000)
      log.append('User', entryAt(1))
      vi.setSystemTime(Date.now() + 5 * 60 * 1_000)
      expect(log.length('User')).toBe(1)
    })
  })

  describe('multi-model isolation', () => {
    it('keeps per-model entries independent', () => {
      const log = createInProcessChangeLog()
      log.configure('User', 60_000)
      log.configure('Post', 60_000)
      log.append('User', entryAt(1))
      log.append('Post', entryAt(1))
      log.append('Post', entryAt(2))
      expect(log.length('User')).toBe(1)
      expect(log.length('Post')).toBe(2)
    })
  })
})
