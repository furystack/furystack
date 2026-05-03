import { describe, expect, it } from 'vitest'
import { compareRedisStreamId } from './compare-redis-stream-id.js'

describe('compareRedisStreamId', () => {
  it('returns zero on equal ids', () => {
    expect(compareRedisStreamId('1700000000000-0', '1700000000000-0')).toBe(0)
  })

  it('orders by millisecond component first', () => {
    expect(compareRedisStreamId('1700000000000-0', '1700000000001-0')).toBeLessThan(0)
    expect(compareRedisStreamId('1700000000010-0', '1700000000002-0')).toBeGreaterThan(0)
  })

  it('uses the sequence component as a tiebreaker when ms match', () => {
    expect(compareRedisStreamId('1700000000000-0', '1700000000000-1')).toBeLessThan(0)
    expect(compareRedisStreamId('1700000000000-9', '1700000000000-2')).toBeGreaterThan(0)
  })

  it('does not order lexicographically (regression: 9-0 vs 10-0)', () => {
    expect(compareRedisStreamId('9-0', '10-0')).toBeLessThan(0)
  })

  it('treats id without seq as seq=0', () => {
    expect(compareRedisStreamId('1700000000000', '1700000000000-0')).toBe(0)
    expect(compareRedisStreamId('1700000000000', '1700000000000-1')).toBeLessThan(0)
  })
})
