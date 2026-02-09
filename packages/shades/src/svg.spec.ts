import { describe, expect, it } from 'vitest'
import { isSvgTag, SVG_NS, SVG_TAGS } from './svg.js'

describe('svg', () => {
  describe('SVG_NS', () => {
    it('should be the standard SVG namespace URI', () => {
      expect(SVG_NS).toBe('http://www.w3.org/2000/svg')
    })
  })

  describe('SVG_TAGS', () => {
    it('should contain core SVG element tags', () => {
      const coreTags = ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']
      for (const tag of coreTags) {
        expect(SVG_TAGS.has(tag)).toBe(true)
      }
    })

    it('should contain text-related SVG tags', () => {
      expect(SVG_TAGS.has('text')).toBe(true)
      expect(SVG_TAGS.has('tspan')).toBe(true)
      expect(SVG_TAGS.has('textPath')).toBe(true)
    })

    it('should contain gradient and pattern tags', () => {
      expect(SVG_TAGS.has('linearGradient')).toBe(true)
      expect(SVG_TAGS.has('radialGradient')).toBe(true)
      expect(SVG_TAGS.has('stop')).toBe(true)
      expect(SVG_TAGS.has('pattern')).toBe(true)
    })

    it('should contain filter primitive tags', () => {
      const filterTags = [
        'filter',
        'feBlend',
        'feColorMatrix',
        'feGaussianBlur',
        'feOffset',
        'feFlood',
        'feMerge',
        'feMergeNode',
        'feComposite',
      ]
      for (const tag of filterTags) {
        expect(SVG_TAGS.has(tag)).toBe(true)
      }
    })

    it('should contain animation tags', () => {
      expect(SVG_TAGS.has('animate')).toBe(true)
      expect(SVG_TAGS.has('animateMotion')).toBe(true)
      expect(SVG_TAGS.has('animateTransform')).toBe(true)
      expect(SVG_TAGS.has('set')).toBe(true)
    })

    it('should not contain HTML element tags', () => {
      const htmlTags = ['div', 'span', 'p', 'button', 'input', 'form', 'table', 'a', 'img']
      for (const tag of htmlTags) {
        expect(SVG_TAGS.has(tag)).toBe(false)
      }
    })
  })

  describe('isSvgTag', () => {
    it('should return true for known SVG tags', () => {
      expect(isSvgTag('svg')).toBe(true)
      expect(isSvgTag('path')).toBe(true)
      expect(isSvgTag('circle')).toBe(true)
      expect(isSvgTag('g')).toBe(true)
      expect(isSvgTag('feGaussianBlur')).toBe(true)
      expect(isSvgTag('linearGradient')).toBe(true)
      expect(isSvgTag('clipPath')).toBe(true)
      expect(isSvgTag('foreignObject')).toBe(true)
    })

    it('should return false for HTML tags', () => {
      expect(isSvgTag('div')).toBe(false)
      expect(isSvgTag('span')).toBe(false)
      expect(isSvgTag('button')).toBe(false)
      expect(isSvgTag('input')).toBe(false)
    })

    it('should return false for unknown tags', () => {
      expect(isSvgTag('my-component')).toBe(false)
      expect(isSvgTag('')).toBe(false)
      expect(isSvgTag('SVG')).toBe(false)
    })
  })
})
