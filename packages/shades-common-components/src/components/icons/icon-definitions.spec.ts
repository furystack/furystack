import { describe, expect, it } from 'vitest'
import * as allIcons from './icon-definitions.js'
import type { IconDefinition } from './icon-types.js'

const iconEntries = Object.entries(allIcons)

describe('Icon definitions', () => {
  it('should export at least 50 icons', () => {
    expect(iconEntries.length).toBeGreaterThanOrEqual(50)
  })

  describe.each(iconEntries)('%s', (_name, icon) => {
    it('should have a paths array with at least one path', () => {
      expect(Array.isArray(icon.paths)).toBe(true)
      expect(icon.paths.length).toBeGreaterThanOrEqual(1)
    })

    it('should have non-empty d attributes on all paths', () => {
      for (const path of icon.paths) {
        expect(typeof path.d).toBe('string')
        expect(path.d.length).toBeGreaterThan(0)
      }
    })

    it('should have a valid style if specified', () => {
      if (icon.style !== undefined) {
        expect(['fill', 'stroke']).toContain(icon.style)
      }
    })

    it('should have a valid viewBox format if specified', () => {
      if (icon.viewBox !== undefined) {
        expect(icon.viewBox).toMatch(/^\d+\s+\d+\s+\d+\s+\d+$/)
      }
    })

    it('should have a positive strokeWidth if specified', () => {
      if (icon.strokeWidth !== undefined) {
        expect(icon.strokeWidth).toBeGreaterThan(0)
      }
    })

    it('should have valid fillRule on paths if specified', () => {
      for (const path of icon.paths) {
        if (path.fillRule !== undefined) {
          expect(['evenodd', 'nonzero']).toContain(path.fillRule)
        }
      }
    })
  })

  it('should not have duplicate path data across different icons', () => {
    const pathSignatures = new Map<string, string>()
    for (const [name, icon] of iconEntries) {
      const signature = icon.paths.map((p) => p.d).join('|')
      const existing = pathSignatures.get(signature)
      if (existing) {
        // Allow outline/fill variants of the same shape (e.g. star / starOutline, heart / heartOutline)
        const isVariantPair =
          (name.includes('Outline') && existing === name.replace('Outline', '')) ||
          (existing.includes('Outline') && name === existing.replace('Outline', ''))
        if (!isVariantPair) {
          expect.fail(`Icon "${name}" has identical path data to "${existing}"`)
        }
      }
      pathSignatures.set(signature, name)
    }
  })
})
