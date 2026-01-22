import { describe, expect, it } from 'vitest'
import { CHANGELOG_SECTIONS } from './changelogSections'
import {
  generateChangelogFilename,
  generateChangelogTemplate,
  generateDependabotChangelogTemplate,
} from './changelogTemplates'

describe('generateChangelogTemplate', () => {
  it('should include version-type comment at the start', () => {
    const template = generateChangelogTemplate('@furystack/core', 'patch')

    expect(template).toMatch(/^<!-- version-type: patch -->/)
  })

  it('should include package name as h1 heading', () => {
    const template = generateChangelogTemplate('@furystack/core', 'minor')

    expect(template).toContain('# @furystack/core')
  })

  it('should include formatting guide comment', () => {
    const template = generateChangelogTemplate('@furystack/core', 'patch')

    expect(template).toContain('FORMATTING GUIDE:')
    expect(template).toContain('### Detailed Entry')
    expect(template).toContain('### Simple List Items')
  })

  describe('patch template', () => {
    it('should include standard sections', () => {
      const template = generateChangelogTemplate('@furystack/core', 'patch')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.FEATURES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BUG_FIXES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DOCUMENTATION}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.PERFORMANCE}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.REFACTORING}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.TESTS}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BUILD}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.CI}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPENDENCIES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.CHORES}`)
    })

    it('should NOT include breaking changes section for patch', () => {
      const template = generateChangelogTemplate('@furystack/core', 'patch')

      expect(template).not.toContain(CHANGELOG_SECTIONS.BREAKING_CHANGES)
    })

    it('should NOT include deprecated section for patch', () => {
      const template = generateChangelogTemplate('@furystack/core', 'patch')

      expect(template).not.toContain(CHANGELOG_SECTIONS.DEPRECATED)
    })
  })

  describe('minor template', () => {
    it('should include deprecated section', () => {
      const template = generateChangelogTemplate('@furystack/core', 'minor')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPRECATED}`)
    })

    it('should NOT include breaking changes section for minor', () => {
      const template = generateChangelogTemplate('@furystack/core', 'minor')

      expect(template).not.toContain(CHANGELOG_SECTIONS.BREAKING_CHANGES)
    })

    it('should include standard sections', () => {
      const template = generateChangelogTemplate('@furystack/core', 'minor')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.FEATURES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BUG_FIXES}`)
    })
  })

  describe('major template', () => {
    it('should include breaking changes section', () => {
      const template = generateChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BREAKING_CHANGES}`)
    })

    it('should include deprecated section', () => {
      const template = generateChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPRECATED}`)
    })

    it('should include migration placeholder for breaking changes', () => {
      const template = generateChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain('MIGRATION REQUIRED:')
    })

    it('should include all standard sections', () => {
      const template = generateChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.FEATURES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BUG_FIXES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DOCUMENTATION}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPENDENCIES}`)
    })
  })

  it('should include placeholder comments for each section', () => {
    const template = generateChangelogTemplate('@furystack/core', 'patch')

    expect(template).toContain('<!-- PLACEHOLDER:')
    expect(template).toContain('feat:')
    expect(template).toContain('fix:')
  })
})

describe('generateChangelogFilename', () => {
  it('should sanitize scoped package names by replacing slash with dash', () => {
    const filename = generateChangelogFilename('@furystack/core', 'abc123')

    expect(filename).toBe('@furystack-core.abc123.md')
  })

  it('should handle unscoped package names', () => {
    const filename = generateChangelogFilename('my-package', 'def456')

    expect(filename).toBe('my-package.def456.md')
  })

  it('should combine package name and manifest ID with dot separator', () => {
    const filename = generateChangelogFilename('@scope/name', 'manifest-id')

    expect(filename).toBe('@scope-name.manifest-id.md')
  })

  it('should always end with .md extension', () => {
    const filename = generateChangelogFilename('@furystack/utils', 'xyz789')

    expect(filename).toMatch(/\.md$/)
  })
})

describe('generateDependabotChangelogTemplate', () => {
  describe('with patch version', () => {
    it('should include dependencies section', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'patch')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPENDENCIES}`)
    })

    it('should use default message when no message provided', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'patch')

      expect(template).toContain('- Updated dependencies')
    })

    it('should use custom message when provided', () => {
      const template = generateDependabotChangelogTemplate(
        '@furystack/core',
        'patch',
        'Bump lodash from 4.17.20 to 4.17.21',
      )

      expect(template).toContain('- Bump lodash from 4.17.20 to 4.17.21')
      expect(template).not.toContain('Updated dependencies')
    })

    it('should NOT include breaking changes section for patch', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'patch')

      expect(template).not.toContain(CHANGELOG_SECTIONS.BREAKING_CHANGES)
    })

    it('should include version-type comment', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'patch')

      expect(template).toContain('<!-- version-type: patch -->')
    })

    it('should include package name as h1 heading', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'patch')

      expect(template).toContain('# @furystack/core')
    })
  })

  describe('with minor version', () => {
    it('should include dependencies section', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'minor')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPENDENCIES}`)
    })

    it('should NOT include breaking changes section', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'minor')

      expect(template).not.toContain(CHANGELOG_SECTIONS.BREAKING_CHANGES)
    })

    it('should include version-type comment', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'minor')

      expect(template).toContain('<!-- version-type: minor -->')
    })
  })

  describe('with major version', () => {
    it('should include both breaking changes and dependencies sections', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain(`## ${CHANGELOG_SECTIONS.BREAKING_CHANGES}`)
      expect(template).toContain(`## ${CHANGELOG_SECTIONS.DEPENDENCIES}`)
    })

    it('should use default message in both sections', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'major')

      const matches = template.match(/- Updated dependencies/g)
      expect(matches).toHaveLength(2)
    })

    it('should use custom message in both sections when provided', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'major', 'Major dependency update')

      const matches = template.match(/- Major dependency update/g)
      expect(matches).toHaveLength(2)
    })

    it('should include version-type comment', () => {
      const template = generateDependabotChangelogTemplate('@furystack/core', 'major')

      expect(template).toContain('<!-- version-type: major -->')
    })
  })
})
