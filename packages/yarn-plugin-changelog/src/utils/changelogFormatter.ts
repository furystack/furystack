import type { ParsedChangelog } from './types'
import { getDependencyDiff } from './dependencyDiff'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

/**
 * Format changelog content for inclusion in CHANGELOG.md
 * @param changelog - The parsed changelog
 * @param version - The version number
 * @param date - The release date (YYYY-MM-DD format)
 * @returns Formatted changelog entry
 */
export function formatChangelogEntry(changelog: ParsedChangelog, version: string, date: string): string {
  let output = `## [${version}] - ${date}\n\n`
  
  const sections = changelog.sections.map(section => {
    if (!section.isEmpty) {
      return `### ${section.name}\n${section.content.trim()}\n\n`
    }
    return ''
  }).join('')

  output += sections

  if (changelog.includeDependencies && changelog.upstreamBranch) {
    try {
      const pkgDir = path.join(process.cwd(), 'packages', changelog.packageName)
      const localPkgPath = path.join(pkgDir, 'package.json')

      if (fs.existsSync(localPkgPath)) {
        const upstreamBranch = changelog.upstreamBranch
        const upstreamContent = execSync(`git show ${upstreamBranch}:${localPkgPath}`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString()

        const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

        if (Object.keys(added).length > 0 || Object.keys(updated).length > 0) {
          const allDeps = Object.entries({ ...added, ...updated }).sort((a, b) => a[0].localeCompare(b[0]))
          let depsList = allDeps.map(([name, version]) => `- ${name}@${version}`).join('\n')

          output += `## 📦 Dependencies\n${depsList}\n\n`
        }
      }
    } catch (error) {
      console.error('Error generating dependencies section:', error)
    }
  }

  return output
}
