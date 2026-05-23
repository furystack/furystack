import { describe, it, expect } from 'vitest'
import { SuspendedError, isSuspendedError } from './suspended-error.js'

describe('SuspendedError', () => {
  it('carries the awaited child IDs', () => {
    const err = new SuspendedError(['a', 'b'])
    expect(err.awaitedChildIds).toEqual(['a', 'b'])
    expect(err.name).toBe('SuspendedError')
    expect(err.message).toBe('Task suspended — awaiting children')
  })

  it('is an instance of Error', () => {
    expect(new SuspendedError([])).toBeInstanceOf(Error)
  })
})

describe('isSuspendedError', () => {
  it('returns true for SuspendedError instances', () => {
    expect(isSuspendedError(new SuspendedError([]))).toBe(true)
  })

  it('returns false for plain errors and non-errors', () => {
    expect(isSuspendedError(new Error('nope'))).toBe(false)
    expect(isSuspendedError(null)).toBe(false)
    expect(isSuspendedError('string')).toBe(false)
  })
})
