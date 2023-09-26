import { sleepAsync } from '@furystack/utils'
import { promisifyAnimation } from './promisify-animation.js'
import { describe, it, expect, vi } from 'vitest'

describe('promisifyAnimation', () => {
  it('should trigger the element animation', async () => {
    const el = document.createElement('div')
    const onfinish = vi.fn()
    const oncancel = vi.fn()
    const animate = vi.fn(() => {
      const animation = {
        onfinish,
        oncancel,
      }
      sleepAsync(100).then(() => animation.onfinish())
      return animation
    })
    Object.assign(el, { animate })
    const keyframes = [
      {
        color: 'black',
      },
      {
        color: 'red',
      },
    ]
    const options = { duration: 1 }
    await promisifyAnimation(el, keyframes, options)
    expect(animate).toBeCalledWith(keyframes, options)
  })

  it('should reject if no element is provided', async () => {
    expect.assertions(1)
    try {
      await promisifyAnimation(null, [], {})
    } catch (error) {
      expect((error as Error).message).toBe('No element provided')
    }
  })
})
