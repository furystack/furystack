import { describe, expect, it } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { DEFAULT_RETRY_POLICY } from './retry-policy.js'
import { DEFAULT_RETENTION_POLICY } from './types.js'

describe('defineTaskHandler', () => {
  const trivialHandler = async () => undefined

  it('passes through type, version, and handler unchanged', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 7, handler: trivialHandler })
    expect(desc.type).toBe('noop')
    expect(desc.version).toBe(7)
    expect(desc.handler).toBe(trivialHandler)
  })

  it('fills in DEFAULT_RETRY_POLICY when retryPolicy is omitted', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, handler: trivialHandler })
    expect(desc.retryPolicy).toEqual(DEFAULT_RETRY_POLICY)
  })

  it('merges partial retryPolicy onto the defaults', () => {
    const desc = defineTaskHandler({
      type: 'noop',
      version: 1,
      retryPolicy: { maxAttempts: 5, backoff: 'exponential' },
      handler: trivialHandler,
    })
    expect(desc.retryPolicy).toEqual({
      ...DEFAULT_RETRY_POLICY,
      maxAttempts: 5,
      backoff: 'exponential',
    })
  })

  it('fills in DEFAULT_RETENTION_POLICY when retentionPolicy is omitted', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, handler: trivialHandler })
    expect(desc.retentionPolicy).toEqual(DEFAULT_RETENTION_POLICY)
  })

  it('merges partial retentionPolicy onto the defaults', () => {
    const desc = defineTaskHandler({
      type: 'noop',
      version: 1,
      retentionPolicy: { onSuccess: 'delete-all', ttlAfterTerminalDays: 1 },
      handler: trivialHandler,
    })
    expect(desc.retentionPolicy).toEqual({
      ...DEFAULT_RETENTION_POLICY,
      onSuccess: 'delete-all',
      ttlAfterTerminalDays: 1,
    })
  })

  it('defaults cancelOnDrain to false', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, handler: trivialHandler })
    expect(desc.cancelOnDrain).toBe(false)
  })

  it('honors an explicit cancelOnDrain', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, cancelOnDrain: true, handler: trivialHandler })
    expect(desc.cancelOnDrain).toBe(true)
  })

  it('defaults visibilityTimeoutMs to 60_000', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, handler: trivialHandler })
    expect(desc.visibilityTimeoutMs).toBe(60_000)
  })

  it('honors an explicit visibilityTimeoutMs', () => {
    const desc = defineTaskHandler({
      type: 'noop',
      version: 1,
      visibilityTimeoutMs: 12_345,
      handler: trivialHandler,
    })
    expect(desc.visibilityTimeoutMs).toBe(12_345)
  })

  it('defaults progressThrottleMs to 250', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, handler: trivialHandler })
    expect(desc.progressThrottleMs).toBe(250)
  })

  it('honors an explicit progressThrottleMs', () => {
    const desc = defineTaskHandler({ type: 'noop', version: 1, progressThrottleMs: 10, handler: trivialHandler })
    expect(desc.progressThrottleMs).toBe(10)
  })

  it('does not mutate the DEFAULT_RETRY_POLICY constant when overrides are provided', () => {
    const before = { ...DEFAULT_RETRY_POLICY }
    defineTaskHandler({
      type: 'noop',
      version: 1,
      retryPolicy: { maxAttempts: 99 },
      handler: trivialHandler,
    })
    expect(DEFAULT_RETRY_POLICY).toEqual(before)
  })
})
