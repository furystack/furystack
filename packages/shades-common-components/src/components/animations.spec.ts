import { sleepAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { collapse, expand, fadeIn, fadeOut, hideSlide, showParallax, showSlide } from './animations.js'

const createMockElement = (scrollHeight = 100) => {
  const el = document.createElement('div')
  const onfinish = vi.fn<() => void>()
  const oncancel = vi.fn<() => void>()
  const animate = vi.fn(() => {
    const animation = {
      onfinish,
      oncancel,
    }
    void sleepAsync(10).then(() => {
      animation.onfinish()
    })
    return animation
  })
  Object.defineProperty(el, 'animate', { value: animate, writable: true })
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, writable: true })
  return { el, animate, onfinish, oncancel }
}

describe('animations', () => {
  describe('showSlide', () => {
    it('should animate element with slide-in keyframes', async () => {
      const { el, animate } = createMockElement()

      await showSlide(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { transform: 'translate(-350px, 0)scale(0)', opacity: 0 },
          { transform: 'translate(0, 0)scale(1)', opacity: 1 },
        ],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await showSlide(el, { duration: 1000, delay: 200 })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 1000,
          delay: 200,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(showSlide(null)).rejects.toThrow('No element provided')
    })

    it('should reject when element is undefined', async () => {
      await expect(showSlide(undefined)).rejects.toThrow('No element provided')
    })
  })

  describe('hideSlide', () => {
    it('should animate element with slide-out keyframes', async () => {
      const { el, animate } = createMockElement()

      await hideSlide(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { transform: 'translate(0, 0)scale(1)', opacity: 1 },
          { transform: 'translate(-350px, 0)scale(0)', opacity: 0 },
        ],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await hideSlide(el, { duration: 300 })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 300,
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(hideSlide(null)).rejects.toThrow('No element provided')
    })
  })

  describe('fadeOut', () => {
    it('should animate element with fade-out keyframes', async () => {
      const { el, animate } = createMockElement()

      await fadeOut(el)

      expect(animate).toHaveBeenCalledWith(
        [{ opacity: 1 }, { opacity: 0 }],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await fadeOut(el, { duration: 200, fill: 'both' })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 200,
          fill: 'both',
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(fadeOut(null)).rejects.toThrow('No element provided')
    })
  })

  describe('fadeIn', () => {
    it('should animate element with fade-in keyframes', async () => {
      const { el, animate } = createMockElement()

      await fadeIn(el)

      expect(animate).toHaveBeenCalledWith(
        [{ opacity: 0 }, { opacity: 1 }],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await fadeIn(el, { duration: 800, easing: 'linear' })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 800,
          easing: 'linear',
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(fadeIn(null)).rejects.toThrow('No element provided')
    })
  })

  describe('showParallax', () => {
    it('should animate element with parallax keyframes', async () => {
      const { el, animate } = createMockElement()

      await showParallax(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { transform: 'translate(50px, 0)', opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 1 },
        ],
        expect.objectContaining({
          duration: 900,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await showParallax(el, { duration: 1200 })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 1200,
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(showParallax(null)).rejects.toThrow('No element provided')
    })
  })

  describe('collapse', () => {
    it('should animate element with collapse keyframes using scrollHeight', async () => {
      const { el, animate } = createMockElement(150)

      await collapse(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { height: '150px', opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await collapse(el, { duration: 250 })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 250,
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(collapse(null)).rejects.toThrow('No element provided')
    })

    it('should handle zero scrollHeight', async () => {
      const { el, animate } = createMockElement(0)

      await collapse(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { height: '0px', opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        expect.any(Object),
      )
    })
  })

  describe('expand', () => {
    it('should animate element with expand keyframes using scrollHeight', async () => {
      const { el, animate } = createMockElement(200)

      await expand(el)

      expect(animate).toHaveBeenCalledWith(
        [
          { height: '0px', opacity: 0 },
          { height: '200px', opacity: 1 },
        ],
        expect.objectContaining({
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
        }),
      )
    })

    it('should merge custom options', async () => {
      const { el, animate } = createMockElement()

      await expand(el, { duration: 400, fill: 'both' })

      expect(animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 400,
          fill: 'both',
        }),
      )
    })

    it('should reject when element is null', async () => {
      await expect(expand(null)).rejects.toThrow('No element provided')
    })
  })
})
