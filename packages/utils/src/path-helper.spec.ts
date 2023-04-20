import { describe, it, expect } from 'vitest'
import { PathHelper } from './path-helper'

/**
 * Path Helper tests
 */
export const pathHelperTests = describe('PathHelper', () => {
  describe('#trimSlashes()', () => {
    it('should trim from the beginning of the segment', () => {
      expect(PathHelper.trimSlashes('/segment')).toBe('segment')
    })

    it('should trim multiple slashes from the beginning of the segment', () => {
      expect(PathHelper.trimSlashes('//////segment')).toBe('segment')
    })

    it('should trim from the end of the segment', () => {
      expect(PathHelper.trimSlashes('segment/')).toBe('segment')
    })

    it('should trim multiple slashes from the end of the segment', () => {
      expect(PathHelper.trimSlashes('segment///')).toBe('segment')
    })
  })

  describe('#joinPaths()', () => {
    it('should join with slashes', () => {
      const joined = PathHelper.joinPaths('path1', 'path2', 'path3')
      expect(joined).toBe('path1/path2/path3')
    })

    it('should remove slashes from the beginning of the segments', () => {
      const joined = PathHelper.joinPaths('path1', 'path2/', 'path3/')
      expect(joined).toBe('path1/path2/path3')
    })

    it('should remove slashes from the end of the segments', () => {
      const joined = PathHelper.joinPaths('/path1', '/path2', 'path3/')
      expect(joined).toBe('path1/path2/path3')
    })
  })

  describe('#isAncestorOf()', () => {
    it('should return true if content is ancestor', () => {
      expect(PathHelper.isAncestorOf('Root/Example', 'Root/Example/Content1')).toBe(true)
    })

    it('should return true if content is ancestor and ends with a slash', () => {
      expect(PathHelper.isAncestorOf('Root/Example/', 'Root/Example/Content1')).toBe(true)
    })

    it('should return false if content is not an ancestor', () => {
      expect(PathHelper.isAncestorOf('Root/Example/', 'Root/Example2/Content1')).toBe(false)
    })
  })

  describe('#getSegments()', () => {
    it('Should split the path to segments', () => {
      expect(PathHelper.getSegments("Root/Example/('Content1')")).toEqual(['Root', 'Example', "('Content1')"])
    })
  })

  describe('#getParentPath()', () => {
    it('Should return the parent path', () => {
      expect(PathHelper.getParentPath('Root/Example/Content')).toBe('Root/Example')
    })

    it('Should return the path in case of 1 segments', () => {
      expect(PathHelper.getParentPath('Root')).toBe('Root')
    })
  })
})
