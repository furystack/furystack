import { describe, expect, it } from 'vitest'
import { parseChangelogDraft } from './changelogParser'

describe('parseChangelogDraft', () => {
  it('should parse a simple changelog draft with version type and package name', () => {
    const content = `<!-- version-type: minor -->
# @furystack/core

## ✨ Features

- Added new feature

## 🐛 Bug Fixes
`
    const result = parseChangelogDraft(content)

    expect(result.packageName).toBe('@furystack/core')
    expect(result.versionType).toBe('minor')
    expect(result.hasPlaceholders).toBe(false)
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0].name).toBe('✨ Features')
    expect(result.sections[0].isEmpty).toBe(false)
    expect(result.sections[1].name).toBe('🐛 Bug Fixes')
    expect(result.sections[1].isEmpty).toBe(true)
  })

  it('should default to patch version type when not specified', () => {
    const content = `# @furystack/utils

## ✨ Features

- Some feature
`
    const result = parseChangelogDraft(content)

    expect(result.versionType).toBe('patch')
  })

  it('should extract package name from heading', () => {
    const content = `<!-- version-type: major -->
# @scope/my-package

## 💥 Breaking Changes

- Breaking change
`
    const result = parseChangelogDraft(content)

    expect(result.packageName).toBe('@scope/my-package')
  })

  it('should return empty package name when heading is missing', () => {
    const content = `<!-- version-type: patch -->

## ✨ Features

- Feature without package name heading
`
    const result = parseChangelogDraft(content)

    expect(result.packageName).toBe('')
  })

  it('should detect placeholder comments', () => {
    const content = `<!-- version-type: patch -->
# @furystack/core

## ✨ Features

<!-- PLACEHOLDER: Describe your changes -->
`
    const result = parseChangelogDraft(content)

    expect(result.hasPlaceholders).toBe(true)
  })

  it('should not count content that is only HTML comments', () => {
    const content = `<!-- version-type: patch -->
# @furystack/core

## ✨ Features

<!-- This is a comment -->
`
    const result = parseChangelogDraft(content)

    expect(result.sections[0].isEmpty).toBe(true)
  })

  it('should parse multiple sections with content', () => {
    const content = `<!-- version-type: major -->
# @furystack/inject

## 💥 Breaking Changes

- Removed deprecated API

## ✨ Features

- Added new DI feature

## 🐛 Bug Fixes

- Fixed memory leak
`
    const result = parseChangelogDraft(content)

    expect(result.sections).toHaveLength(3)
    expect(result.sections[0].name).toBe('💥 Breaking Changes')
    expect(result.sections[0].isEmpty).toBe(false)
    expect(result.sections[0].content).toContain('Removed deprecated API')
    expect(result.sections[1].name).toBe('✨ Features')
    expect(result.sections[1].isEmpty).toBe(false)
    expect(result.sections[2].name).toBe('🐛 Bug Fixes')
    expect(result.sections[2].isEmpty).toBe(false)
  })

  it('should handle empty content', () => {
    const content = ''
    const result = parseChangelogDraft(content)

    expect(result.packageName).toBe('')
    expect(result.versionType).toBe('patch')
    expect(result.sections).toHaveLength(0)
    expect(result.hasPlaceholders).toBe(false)
  })

  it('should handle content with only package name and version type', () => {
    const content = `<!-- version-type: minor -->
# @furystack/shades
`
    const result = parseChangelogDraft(content)

    expect(result.packageName).toBe('@furystack/shades')
    expect(result.versionType).toBe('minor')
    expect(result.sections).toHaveLength(0)
  })

  it('should preserve whitespace in section content', () => {
    const content = `<!-- version-type: patch -->
# @furystack/core

## ✨ Features

- First item
- Second item
  - Nested item
`
    const result = parseChangelogDraft(content)

    expect(result.sections[0].content).toContain('- First item')
    expect(result.sections[0].content).toContain('- Second item')
    expect(result.sections[0].content).toContain('  - Nested item')
  })
})
