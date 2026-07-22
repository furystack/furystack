import type { ParsedChangelog } from './types'
import { getDependencyDiff } from './dependencyDiff'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

/**
 * Format changelog content for inclusion in CHANGELOG.md
 * @param changelog - The parsed changelog
 * @param version - The version number
 * @param date - The release date (YYYY-MM-DD format)
 * @returns Formatted changelog entry
 */
export function formatChangelogEntry(changelog: ParsedChangelog, version: string, date: string): string {
  let output = `## [${version}] - ${date}\n\n`

  const sections = changelog.sections
    .map((section) => {
      if (!section.isEmpty) {
        return `### ${section.name}\n${section.content.trim()}\n\n`
      }
      return ''
    })
    .join('')

  output += sections

  if (changelog.includeDependencies && changelog.upstreamBranch) {
    try {
      // Attempt to find the package directory.
      // We'll look for the package.json in the current working directory or its children.
      let pkgDir = process.cwd()
      let localPkgPath = path.join(pkgDir, 'package.json')

      // If the current dir isn't the package dir, try to find the one matching changelog.packageName
      if (!fs.existsSync(localPkgPath)) {
        const pkgDirs = fs
          .readdirSync(process.cwd())
          .filter((d) => fs.lstatSync(path.join(process.cwd(), d)).isDirectory())
        const match = pkgDirs.find((d) => d.includes(changelog.packageName.split('/').pop() || ''))
        if (match) {
          pkgDir = path.join(process.cwd(), match)
          localPkgPath = path.join(pkgDir, 'package.json')
        }
      }

      if (fs.existsSync(localPkgPath)) {
        const { upstreamBranch } = changelog
        const upstreamContent = execFileSync('git', ['show', `${upstreamBranch}:${localPkgPath}`], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString()

        const { added, updated } = getDependencyDiff(localPkgPath, upstreamContent)

        if (Object.keys(added).length > 0 || Object.keys(updated).length > 0) {
          const allDeps = Object.entries({ ...added, ...updated }).sort((a, b) => a[0].localeCompare(b[0]))
          const depsList = allDeps.map(([name, depVersion]) => `- ${name}@${depVersion}`).join('\n')

          output += `## 📦 Dependencies\n${depsList}\n\n`
        }
      } else {
        console.warn(
          `Warning: Could not find package.json for ${changelog.packageName} at ${localPkgPath}. Skipping dependency section.`,
        )
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to retrieve upstream dependencies for ${changelog.packageName} from branch ${changelog.upstreamBranch}. Skipping section.`,
      )
    }
  }

  return output
}
