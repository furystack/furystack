import { describe, expect, it } from 'vitest'
import { estimateSize, isChildCompletionStatus, parseAwaitedChildIds, toErrorInfo } from './task-runner-internals.js'

describe('task-runner-internals', () => {
  describe('parseAwaitedChildIds', () => {
    it('decodes a JSON array of ids', () => {
      expect(parseAwaitedChildIds(JSON.stringify(['a', 'b']))).toEqual(['a', 'b'])
    })

    it('returns undefined for an absent token', () => {
      expect(parseAwaitedChildIds(undefined)).toBeUndefined()
    })

    it('returns undefined for a non-array payload', () => {
      expect(parseAwaitedChildIds(JSON.stringify({ not: 'an array' }))).toBeUndefined()
    })

    it('returns undefined for an array with non-string members', () => {
      expect(parseAwaitedChildIds(JSON.stringify(['a', 1]))).toBeUndefined()
    })

    it('returns undefined for malformed JSON', () => {
      expect(parseAwaitedChildIds('{not json')).toBeUndefined()
    })
  })

  describe('isChildCompletionStatus', () => {
    it('accepts terminal child statuses and rejects others', () => {
      expect(isChildCompletionStatus('succeeded')).toBe(true)
      expect(isChildCompletionStatus('failed')).toBe(true)
      expect(isChildCompletionStatus('cancelled')).toBe(true)
      expect(isChildCompletionStatus('running')).toBe(false)
      expect(isChildCompletionStatus('waiting')).toBe(false)
    })
  })

  describe('estimateSize', () => {
    it('returns the serialized byte length', () => {
      expect(estimateSize({ a: 1 })).toBe(Buffer.byteLength(JSON.stringify({ a: 1 })))
    })

    it('returns 0 for a value that cannot be serialized', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      expect(estimateSize(circular)).toBe(0)
    })

    it('returns 0 for undefined (no JSON output)', () => {
      expect(estimateSize(undefined)).toBe(0)
    })
  })

  describe('toErrorInfo', () => {
    it('projects an Error with its stack', () => {
      const info = toErrorInfo(new TypeError('boom'))
      expect(info.name).toBe('TypeError')
      expect(info.message).toBe('boom')
      expect(typeof info.stack).toBe('string')
    })

    it('stringifies a non-Error throw', () => {
      expect(toErrorInfo('plain string')).toEqual({ name: 'Error', message: 'plain string' })
    })
  })
})
