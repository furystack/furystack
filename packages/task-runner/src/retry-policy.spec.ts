import { describe, it, expect } from 'vitest'
import { calculateBackoff, DEFAULT_RETRY_POLICY } from './retry-policy.js'

describe('calculateBackoff', () => {
  it('returns 0 for backoff: none', () => {
    expect(calculateBackoff({ ...DEFAULT_RETRY_POLICY, backoff: 'none' }, 1)).toBe(0)
  })

  it('computes linear backoff', () => {
    const policy = { maxAttempts: 5, backoff: 'linear' as const, baseDelayMs: 1000, jitter: 0 }
    expect(calculateBackoff(policy, 1)).toBe(1000)
    expect(calculateBackoff(policy, 2)).toBe(2000)
    expect(calculateBackoff(policy, 3)).toBe(3000)
  })

  it('computes exponential backoff', () => {
    const policy = { maxAttempts: 5, backoff: 'exponential' as const, baseDelayMs: 1000, jitter: 0 }
    expect(calculateBackoff(policy, 1)).toBe(1000)
    expect(calculateBackoff(policy, 2)).toBe(2000)
    expect(calculateBackoff(policy, 3)).toBe(4000)
  })

  it('applies jitter within expected range', () => {
    const policy = { maxAttempts: 5, backoff: 'exponential' as const, baseDelayMs: 1000, jitter: 0.5 }
    const results = Array.from({ length: 100 }, () => calculateBackoff(policy, 1))
    const min = Math.min(...results)
    const max = Math.max(...results)
    expect(min).toBeGreaterThanOrEqual(500)
    expect(max).toBeLessThanOrEqual(1500)
  })

  it('accepts a deterministic random source', () => {
    const policy = { maxAttempts: 5, backoff: 'exponential' as const, baseDelayMs: 1000, jitter: 0.5 }
    const a = calculateBackoff(policy, 2, () => 0.5)
    const b = calculateBackoff(policy, 2, () => 0.5)
    expect(a).toBe(b)
  })
})
