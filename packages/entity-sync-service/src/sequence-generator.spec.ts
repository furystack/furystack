import { describe, expect, it } from 'vitest'
import { createInProcessSequenceGenerator } from './sequence-generator.js'

describe('SequenceGenerator (in-process)', () => {
  describe('current', () => {
    it('returns 0 for an unknown model', () => {
      const gen = createInProcessSequenceGenerator()
      expect(gen.current('User')).toBe(0)
    })

    it('returns the most recently allocated seq for a known model', () => {
      const gen = createInProcessSequenceGenerator()
      gen.next('User')
      gen.next('User')
      expect(gen.current('User')).toBe(2)
    })
  })

  describe('next', () => {
    it('returns strictly increasing seqs per model', () => {
      const gen = createInProcessSequenceGenerator()
      const v1 = gen.next('User')
      const v2 = gen.next('User')
      const v3 = gen.next('User')
      expect(v1.seq).toBe(1)
      expect(v2.seq).toBe(2)
      expect(v3.seq).toBe(3)
    })

    it('keeps per-model counters isolated', () => {
      const gen = createInProcessSequenceGenerator()
      gen.next('User')
      gen.next('User')
      gen.next('Post')
      expect(gen.current('User')).toBe(2)
      expect(gen.current('Post')).toBe(1)
    })

    it('stamps an ISO-8601 timestamp on every allocation', () => {
      const gen = createInProcessSequenceGenerator()
      const version = gen.next('User')
      expect(() => new Date(version.timestamp).toISOString()).not.toThrow()
      expect(new Date(version.timestamp).toISOString()).toBe(version.timestamp)
    })
  })
})
