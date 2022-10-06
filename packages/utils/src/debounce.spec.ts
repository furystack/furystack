import { debounce } from './debounce'
import { sleepAsync } from './sleep-async'
import { describe, expect, it } from 'vitest'

/**
 * Tests for debounce
 */
export const debounceTests = describe('debounce', () => {
  it('Simple method execution', async () => {
    await new Promise<void>((resolve) => {
      const method = debounce(() => {
        resolve()
      })
      method()
    })
  })

  it('Should be executed once when triggered multiple time in a given range', async () => {
    let counter = 0
    const method = debounce(() => {
      counter++
    }, 10)
    for (let index = 0; index < 10; index++) {
      method()
    }
    await sleepAsync(300)
    expect(counter).toBe(1)
  })

  it('Should be executed multiple times  when triggered multiple times out of a a given range', async () => {
    let counter = 0
    const method = debounce(() => {
      counter++
    }, 10)
    for (let index = 0; index < 10; index++) {
      method()
      await sleepAsync(15)
    }
    await sleepAsync(300)
    expect(counter).toBe(10)
  })
})
