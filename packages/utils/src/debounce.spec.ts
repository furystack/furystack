import { describe, it, expect, vi } from 'vitest'
import { debounce } from './debounce'
import { sleepAsync } from './sleep-async'

/**
 * Tests for debounce
 */
export const debounceTests = describe('debounce', () => {
  it('Simple method execution', async () => {
    const method = vi.fn()
    await new Promise<void>((resolve) => {
      const debouncedMethod = debounce(() => {
        resolve()
        method()
      })
      debouncedMethod()
    })
    expect(method).toBeCalledTimes(1)
  })

  it('Should be executed once when triggered multiple time in a given range', async () => {
    const method = vi.fn()

    const debouncedMethod = debounce(method, 10)
    for (let index = 0; index < 10; index++) {
      debouncedMethod()
    }
    await sleepAsync(300)
    expect(method).toBeCalledTimes(1)
  })

  it('Should be executed multiple times  when triggered multiple times out of a a given range', async () => {
    const method = vi.fn()

    const debouncedMethod = debounce(method, 10)
    for (let index = 0; index < 10; index++) {
      debouncedMethod()
      await sleepAsync(15)
    }
    expect(method).toBeCalledTimes(10)
  })
})
