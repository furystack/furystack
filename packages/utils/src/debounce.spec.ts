import { debounce } from './debounce.js'
import { sleepAsync } from './sleep-async.js'
import { describe, expect, it, vi } from 'vitest'

/**
 * Tests for debounce
 */
export const debounceTests = describe('debounce', () => {
  it('Simple method execution', async () => {
    const callback = vi.fn(() => 1)

    const debounced = debounce(callback)
    await debounced()

    expect(callback).toBeCalledTimes(1)
  })

  it('Should be executed once when triggered multiple time in a given range', async () => {
    const callback = vi.fn(() => undefined)
    const method = debounce(callback, 10)
    for (let index = 0; index < 10; index++) {
      method()
    }
    await sleepAsync(300)
    expect(callback).toBeCalledTimes(1)
  })

  it('Should be executed multiple times  when triggered multiple times out of a a given range', async () => {
    const callback = vi.fn(() => undefined)
    const method = debounce(callback, 10)

    for (let index = 0; index < 10; index++) {
      method()
      await sleepAsync(15)
    }
    expect(callback).toBeCalledTimes(10)
  })

  it('Should be executed multiple times when awaited', async () => {
    const callback = vi.fn(() => undefined)
    const method = debounce(callback, 10)

    for (let index = 0; index < 10; index++) {
      await method()
    }
    expect(callback).toBeCalledTimes(10)
  })
})
