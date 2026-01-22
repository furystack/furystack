import type { PortablePath } from '@yarnpkg/fslib'
import { describe, expect, it } from 'vitest'
import { extractManifestId, parseVersionManifest, sanitizePackageName } from './parseVersionManifest'

describe('parseVersionManifest', () => {
  it('should parse a simple version manifest', () => {
    const content = `releases:
  "@furystack/core": patch
  "@furystack/inject": minor
`
    const result = parseVersionManifest(content, '.yarn/versions/abc123.yml' as PortablePath)

    expect(result.id).toBe('abc123')
    expect(result.path).toBe('.yarn/versions/abc123.yml')
    expect(result.releases).toHaveLength(2)
    expect(result.releases[0]).toEqual({
      packageName: '@furystack/core',
      versionType: 'patch',
    })
    expect(result.releases[1]).toEqual({
      packageName: '@furystack/inject',
      versionType: 'minor',
    })
  })

  it('should parse manifest with quoted package names', () => {
    const content = `releases:
  "@furystack/core": major
  "@furystack/utils": patch
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(2)
    expect(result.releases[0].packageName).toBe('@furystack/core')
    expect(result.releases[0].versionType).toBe('major')
  })

  it('should parse manifest with single-quoted package names', () => {
    const content = `releases:
  '@furystack/core': patch
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(1)
    expect(result.releases[0].packageName).toBe('@furystack/core')
  })

  it('should handle all version types', () => {
    const content = `releases:
  "patch-pkg": patch
  "minor-pkg": minor
  "major-pkg": major
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(3)
    expect(result.releases[0].versionType).toBe('patch')
    expect(result.releases[1].versionType).toBe('minor')
    expect(result.releases[2].versionType).toBe('major')
  })

  it('should ignore lines before releases section', () => {
    const content = `# This is a comment
declined: []
undecided: []

releases:
  "@furystack/core": patch
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(1)
    expect(result.releases[0].packageName).toBe('@furystack/core')
  })

  it('should return empty releases for manifest without releases section', () => {
    const content = `declined: []
undecided:
  - "@furystack/core"
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(0)
  })

  it('should handle empty content', () => {
    const content = ''
    const result = parseVersionManifest(content, 'empty.yml' as PortablePath)

    expect(result.id).toBe('empty')
    expect(result.releases).toHaveLength(0)
  })

  it('should ignore invalid version types', () => {
    const content = `releases:
  "@furystack/core": invalid
  "@furystack/utils": patch
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(1)
    expect(result.releases[0].packageName).toBe('@furystack/utils')
  })

  it('should handle manifest with extra whitespace', () => {
    const content = `releases:
    "@furystack/core":   patch  
`
    const result = parseVersionManifest(content, 'test.yml' as PortablePath)

    expect(result.releases).toHaveLength(1)
    expect(result.releases[0].packageName).toBe('@furystack/core')
    expect(result.releases[0].versionType).toBe('patch')
  })
})

describe('sanitizePackageName', () => {
  it('should replace forward slashes with hyphens', () => {
    expect(sanitizePackageName('@furystack/core')).toBe('@furystack-core')
  })

  it('should handle package names without slashes', () => {
    expect(sanitizePackageName('lodash')).toBe('lodash')
  })

  it('should handle multiple slashes', () => {
    expect(sanitizePackageName('@scope/nested/package')).toBe('@scope-nested-package')
  })

  it('should handle empty string', () => {
    expect(sanitizePackageName('')).toBe('')
  })
})

describe('extractManifestId', () => {
  it('should extract ID from simple filename', () => {
    expect(extractManifestId('abc123.yml' as PortablePath)).toBe('abc123')
  })

  it('should extract ID from path with directory', () => {
    expect(extractManifestId('.yarn/versions/e94f7891.yml' as PortablePath)).toBe('e94f7891')
  })

  it('should handle deep paths', () => {
    expect(extractManifestId('/home/user/project/.yarn/versions/manifest.yml' as PortablePath)).toBe('manifest')
  })

  it('should return empty string for empty path', () => {
    expect(extractManifestId('' as PortablePath)).toBe('')
  })

  it('should handle path without .yml extension', () => {
    expect(extractManifestId('path/to/file' as PortablePath)).toBe('file')
  })
})
