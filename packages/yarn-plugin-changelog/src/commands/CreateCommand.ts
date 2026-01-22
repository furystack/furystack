import { BaseCommand } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'
import type { PortablePath } from '@yarnpkg/fslib'
import { ppath, xfs } from '@yarnpkg/fslib'
import { Command, Option } from 'clipanion'

import { parseChangelogDraft } from '../utils/changelogParser'
import {
  generateChangelogFilename,
  generateChangelogTemplate,
  generateDependabotChangelogTemplate,
} from '../utils/changelogTemplates'
import { analyzeChangelogForRegeneration } from '../utils/changelogValidator'
import { CHANGELOGS_DIR, VERSIONS_DIR } from '../utils/directoryPaths'
import { parseVersionManifest } from '../utils/parseVersionManifest'

// Re-export for backwards compatibility and testing
export { analyzeChangelogForRegeneration } from '../utils/changelogValidator'
export type { ChangelogAnalysis } from '../utils/types'

/**
 * Command to generate changelog drafts from version manifests.
 *
 * Reads `.yarn/versions/*.yml` files and generates draft changelogs
 * at `.yarn/changelogs/{packageName}.{manifestId}.md`
 */
export class CreateCommand extends BaseCommand {
  static override paths = [['changelog', 'create']]

  static override usage = Command.Usage({
    description: 'Generate changelog drafts from version manifests',
    details: `
      This command reads all version manifests in \`.yarn/versions/*.yml\`
      and generates draft changelog files in \`.yarn/changelogs/\`.

      Each draft includes sections for Added, Changed, and Fixed entries.
      For major/minor releases, additional sections are included.

      Existing changelog drafts are not overwritten unless --force is used.

      Use --dependabot to auto-fill changelogs for dependency updates.
      The --message option can provide a custom message (e.g., PR title).
    `,
    examples: [
      ['Generate changelog drafts', 'yarn changelog create'],
      ['Regenerate mismatched/invalid changelogs', 'yarn changelog create --force'],
      ['Generate for Dependabot PR', 'yarn changelog create --dependabot'],
      ['Generate with custom message', 'yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"'],
    ],
  })

  verbose = Option.Boolean('-v,--verbose', false, {
    description: 'Show verbose output',
  })

  force = Option.Boolean('-f,--force', false, {
    description: 'Regenerate changelogs with mismatched version types or invalid entries',
  })

  dependabot = Option.Boolean('--dependabot', false, {
    description: 'Auto-fill changelog for dependency updates (Dependabot PRs)',
  })

  message = Option.String('-m,--message', {
    description: 'Custom message for the changelog entry (used with --dependabot)',
  })

  /**
   * Execute the command
   */
  public async execute(): Promise<number> {
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins)
    const { project } = await Project.find(configuration, this.context.cwd)

    const versionsDir = ppath.join(project.cwd, VERSIONS_DIR as PortablePath)
    const changelogsDir = ppath.join(project.cwd, CHANGELOGS_DIR as PortablePath)

    // Ensure changelogs directory exists
    await xfs.mkdirPromise(changelogsDir, { recursive: true })

    // Check if versions directory exists
    if (!(await xfs.existsPromise(versionsDir))) {
      this.context.stdout.write('No .yarn/versions directory found. Nothing to do.\n')
      return 0
    }

    // Read all version manifest files
    const files = await xfs.readdirPromise(versionsDir)
    const ymlFiles = files.filter((f) => f.endsWith('.yml'))

    if (ymlFiles.length === 0) {
      this.context.stdout.write('No version manifests found. Nothing to do.\n')
      return 0
    }

    let createdCount = 0
    let regeneratedCount = 0
    let skippedCount = 0

    for (const ymlFile of ymlFiles) {
      const manifestPath = ppath.join(versionsDir, ymlFile)
      const content = await xfs.readFilePromise(manifestPath, 'utf8')
      const manifest = parseVersionManifest(content, manifestPath)

      if (this.verbose) {
        this.context.stdout.write(`Processing manifest: ${ymlFile}\n`)
      }

      for (const release of manifest.releases) {
        const filename = generateChangelogFilename(release.packageName, manifest.id)
        const changelogPath = ppath.join(changelogsDir, filename as PortablePath)

        // Check if file already exists
        if (await xfs.existsPromise(changelogPath)) {
          const existingContent = await xfs.readFilePromise(changelogPath, 'utf8')
          const existingChangelog = parseChangelogDraft(existingContent)

          // Analyze for version type mismatch and content validation errors
          const analysis = analyzeChangelogForRegeneration(existingChangelog, release.versionType)

          if (this.force && analysis.shouldRegenerate) {
            // Regenerate due to version type mismatch or invalid content
            const template = this.dependabot
              ? generateDependabotChangelogTemplate(release.packageName, release.versionType, this.message)
              : generateChangelogTemplate(release.packageName, release.versionType)
            await xfs.writeFilePromise(changelogPath, template)

            // Build descriptive regeneration message
            const reasons: string[] = []
            if (analysis.hasVersionMismatch) {
              reasons.push(`${existingChangelog.versionType} → ${release.versionType}`)
            }
            if (analysis.contentErrors.length > 0) {
              reasons.push(...analysis.contentErrors)
            }

            this.context.stdout.write(`  Regenerated: ${filename} (${reasons.join(', ')})\n`)
            regeneratedCount++
            continue
          }

          if (this.verbose) {
            if (analysis.shouldRegenerate) {
              const issues: string[] = []
              if (analysis.hasVersionMismatch) {
                issues.push(`version mismatch: ${existingChangelog.versionType} vs ${release.versionType}`)
              }
              if (analysis.contentErrors.length > 0) {
                issues.push(...analysis.contentErrors.map((e) => e.toLowerCase()))
              }
              this.context.stdout.write(
                `  Skipping ${release.packageName} (${issues.join('; ')}, use --force to regenerate)\n`,
              )
            } else {
              this.context.stdout.write(`  Skipping ${release.packageName} (already exists)\n`)
            }
          }
          skippedCount++
          continue
        }

        // Generate and write the changelog template
        const template = this.dependabot
          ? generateDependabotChangelogTemplate(release.packageName, release.versionType, this.message)
          : generateChangelogTemplate(release.packageName, release.versionType)
        await xfs.writeFilePromise(changelogPath, template)

        this.context.stdout.write(`  Created: ${filename} (${release.versionType})\n`)
        createdCount++
      }
    }

    const parts = [`Created ${createdCount}`]
    if (regeneratedCount > 0) {
      parts.push(`regenerated ${regeneratedCount}`)
    }
    parts.push(`skipped ${skippedCount}`)
    this.context.stdout.write(`\nDone! ${parts.join(', ')} changelog draft(s).\n`)

    return 0
  }
}
