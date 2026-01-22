import { describe, expect, it } from 'vitest'
import { formatChangelogEntry } from './changelogFormatter'
import type { ParsedChangelog } from './types'

describe('formatChangelogEntry', () => {
  it('should format a changelog entry with version and date', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'minor',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- Added new feature\n',
          isEmpty: false,
        },
      ],
    }

    const result = formatChangelogEntry(changelog, '1.2.0', '2025-01-22')

    expect(result).toBe(`## [1.2.0] - 2025-01-22

### ✨ Features
- Added new feature

`)
  })

  it('should skip empty sections', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '',
          isEmpty: true,
        },
        {
          name: '🐛 Bug Fixes',
          content: '- Fixed a bug\n',
          isEmpty: false,
        },
      ],
    }

    const result = formatChangelogEntry(changelog, '1.0.1', '2025-01-22')

    expect(result).not.toContain('### ✨ Features')
    expect(result).toContain('### 🐛 Bug Fixes')
    expect(result).toContain('- Fixed a bug')
  })

  it('should handle multiple non-empty sections', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/inject',
      versionType: 'major',
      hasPlaceholders: false,
      sections: [
        {
          name: '💥 Breaking Changes',
          content: '- Removed deprecated method\n',
          isEmpty: false,
        },
        {
          name: '✨ Features',
          content: '- New API introduced\n',
          isEmpty: false,
        },
        {
          name: '🐛 Bug Fixes',
          content: '- Fixed edge case\n',
          isEmpty: false,
        },
      ],
    }

    const result = formatChangelogEntry(changelog, '2.0.0', '2025-01-22')

    expect(result).toContain('## [2.0.0] - 2025-01-22')
    expect(result).toContain('### 💥 Breaking Changes')
    expect(result).toContain('### ✨ Features')
    expect(result).toContain('### 🐛 Bug Fixes')
  })

  it('should trim trailing whitespace from section content', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [
        {
          name: '🐛 Bug Fixes',
          content: '- Fixed issue   \n\n  ',
          isEmpty: false,
        },
      ],
    }

    const result = formatChangelogEntry(changelog, '1.0.1', '2025-01-22')

    expect(result).toContain('- Fixed issue')
    expect(result).not.toMatch(/- Fixed issue\s{3}/)
  })

  it('should handle changelog with no non-empty sections', () => {
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

    const result = formatChangelogEntry(changelog, '1.0.0', '2025-01-22')

    expect(result).toBe(`## [1.0.0] - 2025-01-22

`)
  })

  it('should handle changelog with empty sections array', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'patch',
      hasPlaceholders: false,
      sections: [],
    }

    const result = formatChangelogEntry(changelog, '1.0.0', '2025-01-22')

    expect(result).toBe(`## [1.0.0] - 2025-01-22

`)
  })
})
