import { sleepAsync } from './sleep-async.js'
import { describe, expect, it } from 'vitest'

/**
 * Tests for async sleep
 */
export const sleepAsyncTests = describe('sleepAsync', () => {
  it('Should return a Promise', () => {
    expect(sleepAsync()).toBeInstanceOf(Promise)
  })

  it('Should be resolved in time', async () => {
    await sleepAsync(15)
  })
})
