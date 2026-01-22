import { describe, expect, it } from 'vitest'
import { CHANGELOG_SECTIONS } from './changelogSections'
import { analyzeChangelogForRegeneration, validateChangelog, validateDraftForApply } from './changelogValidator'
import type { ParsedChangelog } from './types'

describe('validateChangelog', () => {
  it('should return no errors for a valid changelog', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '🐛 Bug Fixes',
          content: '- Fixed issue\n',
          isEmpty: false,
        },
      ],
    }

    const errors = validateChangelog(changelog)

    expect(errors).toHaveLength(0)
  })

  it('should return error when no section has content', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: true,
      sections: [
        {
          name: '✨ Features',
          content: '',
          isEmpty: true,
        },
        {
          name: '🐛 Bug Fixes',
          content: '',
          isEmpty: true,
        },
      ],
    }

    const errors = validateChangelog(changelog)

    expect(errors).toContain('At least one section must have content')
  })

  it('should return error for major release without breaking changes', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'major',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- New feature\n',
          isEmpty: false,
        },
        {
          name: CHANGELOG_SECTIONS.BREAKING_CHANGES,
          content: '',
          isEmpty: true,
        },
      ],
    }

    const errors = validateChangelog(changelog)

    expect(errors).toContain(`Major release requires filled "${CHANGELOG_SECTIONS.BREAKING_CHANGES}" section`)
  })

  it('should pass for major release with breaking changes', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'major',
      hasPlaceholders: false,
      sections: [
        {
          name: CHANGELOG_SECTIONS.BREAKING_CHANGES,
          content: '- Removed deprecated API\n',
          isEmpty: false,
        },
      ],
    }

    const errors = validateChangelog(changelog)

    expect(errors).toHaveLength(0)
  })

  it('should return error for version type mismatch when expectedVersionType is provided', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '🐛 Bug Fixes',
          content: '- Fixed\n',
          isEmpty: false,
        },
      ],
    }

    const errors = validateChangelog(changelog, { expectedVersionType: 'minor' })

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('Version type mismatch')
    expect(errors[0]).toContain('patch')
    expect(errors[0]).toContain('minor')
  })

  it('should pass when version type matches expected', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'minor',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- Feature\n',
          isEmpty: false,
        },
      ],
    }

    const errors = validateChangelog(changelog, { expectedVersionType: 'minor' })

    expect(errors).toHaveLength(0)
  })

  it('should return multiple errors when multiple validations fail', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'major',
      hasPlaceholders: true,
      sections: [
        {
          name: CHANGELOG_SECTIONS.BREAKING_CHANGES,
          content: '',
          isEmpty: true,
        },
        {
          name: '✨ Features',
          content: '',
          isEmpty: true,
        },
      ],
    }

    const errors = validateChangelog(changelog, { expectedVersionType: 'minor' })

    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})

describe('validateDraftForApply', () => {
  it('should return valid for draft with package name', () => {
    const result = validateDraftForApply('@furystack/core', 'changelog.md')

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return invalid for draft without package name', () => {
    const result = validateDraftForApply('', 'changelog.md')

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Missing package name heading')
    expect(result.errors[0]).toContain('changelog.md')
  })
})

describe('analyzeChangelogForRegeneration', () => {
  it('should not recommend regeneration for valid changelog with matching version', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'minor',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- Feature\n',
          isEmpty: false,
        },
      ],
    }

    const analysis = analyzeChangelogForRegeneration(changelog, 'minor')

    expect(analysis.shouldRegenerate).toBe(false)
    expect(analysis.hasVersionMismatch).toBe(false)
    expect(analysis.contentErrors).toHaveLength(0)
  })

  it('should recommend regeneration for version type mismatch', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '🐛 Bug Fixes',
          content: '- Fix\n',
          isEmpty: false,
        },
      ],
    }

    const analysis = analyzeChangelogForRegeneration(changelog, 'minor')

    expect(analysis.shouldRegenerate).toBe(true)
    expect(analysis.hasVersionMismatch).toBe(true)
    expect(analysis.contentErrors).toHaveLength(0)
  })

  it('should recommend regeneration for content errors', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: true,
      sections: [
        {
          name: '✨ Features',
          content: '',
          isEmpty: true,
        },
      ],
    }

    const analysis = analyzeChangelogForRegeneration(changelog, 'patch')

    expect(analysis.shouldRegenerate).toBe(true)
    expect(analysis.hasVersionMismatch).toBe(false)
    expect(analysis.contentErrors).toContain('At least one section must have content')
  })

  it('should recommend regeneration for major without breaking changes', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'major',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- Feature\n',
          isEmpty: false,
        },
        {
          name: CHANGELOG_SECTIONS.BREAKING_CHANGES,
          content: '',
          isEmpty: true,
        },
      ],
    }

    const analysis = analyzeChangelogForRegeneration(changelog, 'major')

    expect(analysis.shouldRegenerate).toBe(true)
    expect(analysis.hasVersionMismatch).toBe(false)
    expect(analysis.contentErrors.length).toBeGreaterThan(0)
  })

  it('should exclude version mismatch error from contentErrors', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '🐛 Bug Fixes',
          content: '- Fix\n',
          isEmpty: false,
        },
      ],
    }

    const analysis = analyzeChangelogForRegeneration(changelog, 'minor')

    expect(analysis.contentErrors.some((e) => e.includes('Version type mismatch'))).toBe(false)
  })
})
