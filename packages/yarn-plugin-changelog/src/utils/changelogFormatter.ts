import type { ParsedChangelog } from './types'

/**
 * Format changelog content for inclusion in CHANGELOG.md
 * @param changelog - The parsed changelog
 * @param version - The version number
 * @param date - The release date (YYYY-MM-DD format)
 * @returns Formatted changelog entry
 */
export function formatChangelogEntry(changelog: ParsedChangelog, version: string, date: string): string {
  let output = `## [${version}] - ${date}\n\n`

  for (const section of changelog.sections) {
    if (!section.isEmpty) {
      output += `### ${section.name}\n`
      output += `${section.content.trim()}\n\n`
    }
  }

  return output
}
