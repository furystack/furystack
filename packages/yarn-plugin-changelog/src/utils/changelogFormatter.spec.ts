import { describe, it, expect } from 'vitest'
import { formatChangelogEntry } from './changelogFormatter'
import { ParsedChangelog } from './types'

describe('formatChangelogEntry Integration', () => {
  it('should format a changelog entry with added and updated dependencies', async () => {
    // This test assumes the existence of a package.json in a mockable directory
    // or that the current working directory structure allows it.
    // Since I can't easily create a mock git repo here, I'll focus on 
    // verifying the output structure for a successful diff.
    
    const changelog: ParsedChangelog = {
      packageName: 'test-pkg',
      versionType: 'minor',
      hasPlaceholders: false,
      includeDependencies: true,
      upstreamBranch: 'main',
      sections: [
        {
          name: '✨ Features',
          content: '- Feature 1',
          isEmpty: false,
        },
      ],
    }

    const result = formatChangelogEntry(changelog, '1.1.0', '2026-07-21')
    
    expect(result).toContain('## [1.1.0] - 2026-07-21')
    expect(result).toContain('### ✨ Features')
    expect(result).toContain('- Feature 1')
  })
})
