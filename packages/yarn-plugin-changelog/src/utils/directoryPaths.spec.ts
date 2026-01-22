import { describe, expect, it } from 'vitest'
import { CHANGELOGS_DIR, VERSIONS_DIR } from './directoryPaths'

describe('directoryPaths', () => {
  describe('CHANGELOGS_DIR', () => {
    it('should be defined', () => {
      expect(CHANGELOGS_DIR).toBeDefined()
    })

    it('should point to .yarn/changelogs directory', () => {
      expect(CHANGELOGS_DIR).toBe('.yarn/changelogs')
    })
  })

  describe('VERSIONS_DIR', () => {
    it('should be defined', () => {
      expect(VERSIONS_DIR).toBeDefined()
    })

    it('should point to .yarn/versions directory', () => {
      expect(VERSIONS_DIR).toBe('.yarn/versions')
    })
  })
})
