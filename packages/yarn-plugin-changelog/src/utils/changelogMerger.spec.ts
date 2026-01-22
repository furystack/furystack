import { describe, expect, it } from 'vitest'
import { mergeChangelogs } from './changelogMerger'
import type { ParsedChangelog } from './types'

describe('mergeChangelogs', () => {
  it('should return empty changelog for empty array', () => {
    const result = mergeChangelogs([])

    expect(result.packageName).toBe('')
    expect(result.versionType).toBe('patch')
    expect(result.sections).toHaveLength(0)
    expect(result.hasPlaceholders).toBe(false)
  })

  it('should return the same changelog when only one is provided', () => {
    const changelog: ParsedChangelog = {
      packageName: '@furystack/core',
      versionType: 'minor',
      hasPlaceholders: false,
      sections: [
        {
          name: '✨ Features',
          content: '- New feature\n',
          isEmpty: false,
        },
      ],
    }

    const result = mergeChangelogs([changelog])

    expect(result).toBe(changelog)
  })

  it('should use the highest version type when merging', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [],
      },
      {
        packageName: '@furystack/core',
        versionType: 'major',
        hasPlaceholders: false,
        sections: [],
      },
      {
        packageName: '@furystack/core',
        versionType: 'minor',
        hasPlaceholders: false,
        sections: [],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.versionType).toBe('major')
  })

  it('should preserve package name from first changelog', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [],
      },
      {
        packageName: '@furystack/other',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.packageName).toBe('@furystack/core')
  })

  it('should merge sections with same name', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '✨ Features',
            content: '- Feature A\n',
            isEmpty: false,
          },
        ],
      },
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '✨ Features',
            content: '- Feature B\n',
            isEmpty: false,
          },
        ],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].name).toBe('✨ Features')
    expect(result.sections[0].content).toContain('- Feature A')
    expect(result.sections[0].content).toContain('- Feature B')
    expect(result.sections[0].isEmpty).toBe(false)
  })

  it('should deduplicate identical content (case-insensitive)', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '🐛 Bug Fixes',
            content: '- Fixed the bug\n',
            isEmpty: false,
          },
        ],
      },
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '🐛 Bug Fixes',
            content: '- FIXED THE BUG\n',
            isEmpty: false,
          },
        ],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.sections[0].content.match(/fixed the bug/gi)?.length).toBe(1)
  })

  it('should preserve section order from first occurrence', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '✨ Features',
            content: '- Feature\n',
            isEmpty: false,
          },
          {
            name: '🐛 Bug Fixes',
            content: '- Bug fix\n',
            isEmpty: false,
          },
        ],
      },
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '📚 Documentation',
            content: '- Docs update\n',
            isEmpty: false,
          },
        ],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.sections).toHaveLength(3)
    expect(result.sections[0].name).toBe('✨ Features')
    expect(result.sections[1].name).toBe('🐛 Bug Fixes')
    expect(result.sections[2].name).toBe('📚 Documentation')
  })

  it('should set hasPlaceholders to true if any changelog has placeholders', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [],
      },
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: true,
        sections: [],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.hasPlaceholders).toBe(true)
  })

  it('should skip empty sections when merging', () => {
    const changelogs: ParsedChangelog[] = [
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '✨ Features',
            content: '',
            isEmpty: true,
          },
        ],
      },
      {
        packageName: '@furystack/core',
        versionType: 'patch',
        hasPlaceholders: false,
        sections: [
          {
            name: '✨ Features',
            content: '- Real feature\n',
            isEmpty: false,
          },
        ],
      },
    ]

    const result = mergeChangelogs(changelogs)

    expect(result.sections[0].content).toContain('- Real feature')
    expect(result.sections[0].isEmpty).toBe(false)
  })

  it('should handle version type priority correctly (major > minor > patch)', () => {
    const minorAndPatch = mergeChangelogs([
      { packageName: 'pkg', versionType: 'patch', hasPlaceholders: false, sections: [] },
      { packageName: 'pkg', versionType: 'minor', hasPlaceholders: false, sections: [] },
    ])
    expect(minorAndPatch.versionType).toBe('minor')

    const majorAndMinor = mergeChangelogs([
      { packageName: 'pkg', versionType: 'minor', hasPlaceholders: false, sections: [] },
      { packageName: 'pkg', versionType: 'major', hasPlaceholders: false, sections: [] },
    ])
    expect(majorAndMinor.versionType).toBe('major')

    const patchOnly = mergeChangelogs([
      { packageName: 'pkg', versionType: 'patch', hasPlaceholders: false, sections: [] },
      { packageName: 'pkg', versionType: 'patch', hasPlaceholders: false, sections: [] },
    ])
    expect(patchOnly.versionType).toBe('patch')
  })
})
