import { describe, expect, it } from 'vitest'
import { ReplayWindowExceededError, UnsupportedCapabilityError } from './errors.js'

describe('errors', () => {
  describe('ReplayWindowExceededError', () => {
    it('captures the topic, fromSeq and oldestRetainedSeq', () => {
      const error = new ReplayWindowExceededError('topic', '5', '7')
      expect(error.name).toBe('ReplayWindowExceededError')
      expect(error.topic).toBe('topic')
      expect(error.fromSeq).toBe('5')
      expect(error.oldestRetainedSeq).toBe('7')
      expect(error.message).toContain('topic')
      expect(error.message).toContain('5')
      expect(error.message).toContain('7')
    })

    it('reports "none" when no messages are retained', () => {
      const error = new ReplayWindowExceededError('topic', '5', undefined)
      expect(error.oldestRetainedSeq).toBeUndefined()
      expect(error.message).toContain('none')
    })
  })

  describe('UnsupportedCapabilityError', () => {
    it('captures the missing capability name', () => {
      const error = new UnsupportedCapabilityError('replay')
      expect(error.name).toBe('UnsupportedCapabilityError')
      expect(error.capability).toBe('replay')
      expect(error.message).toContain('replay')
    })
  })
})
