import { BaseCommand } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'
import type { PortablePath } from '@yarnpkg/fslib'
import { ppath, xfs } from '@yarnpkg/fslib'
import { Command, Option } from 'clipanion'

import { formatChangelogEntry, mergeChangelogs, parseChangelogDraft } from '../utils/changelogParser'
import { validateDraftForApply } from '../utils/changelogValidator'
import { CHANGELOGS_DIR } from '../utils/directoryPaths'

// Re-export for backwards compatibility and testing
export { validateDraftForApply } from '../utils/changelogValidator'
export type { DraftValidationResult } from '../utils/types'

/**
 * Default version when package version cannot be determined
 */
const DEFAULT_VERSION = '0.0.0' as const

/**
 * Header line for CHANGELOG.md files
 */
const CHANGELOG_HEADER = '# Changelog' as const

type ChangelogDraft = {
  path: PortablePath
  filename: string
  packageName: string
  content: string
}

/**
 * Command to apply changelog entries to package CHANGELOG.md files.
 *
 * Collects changelog drafts and prepends them to each package's CHANGELOG.md.
 */
export class ApplyCommand extends BaseCommand {
  static override paths = [['changelog', 'apply']]

  static override usage = Command.Usage({
    description: 'Apply changelog entries to package CHANGELOG.md files',
    details: `
      This command:
      - Reads all changelog drafts from \`.yarn/changelogs/\`
      - Groups entries by package name
      - Prepends new entries to each package's CHANGELOG.md
      - Deletes processed draft files
    `,
    examples: [['Apply changelogs', 'yarn changelog apply']],
  })

  verbose = Option.Boolean('-v,--verbose', false, {
    description: 'Show verbose output',
  })

  dryRun = Option.Boolean('--dry-run', false, {
    description: 'Show what would be done without making changes',
  })

  /**
   * Execute the command
   */
  public async execute(): Promise<number> {
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins)
    const { project } = await Project.find(configuration, this.context.cwd)

    const changelogsDir = ppath.join(project.cwd, CHANGELOGS_DIR as PortablePath)

    if (this.dryRun) {
      this.context.stdout.write('[DRY RUN] No changes will be made.\n\n')
    }

    // Check if changelogs directory exists
    if (!(await xfs.existsPromise(changelogsDir))) {
      this.context.stdout.write('No .yarn/changelogs directory found. Nothing to apply.\n')
      return 0
    }

    // Read all changelog draft files
    const files = await xfs.readdirPromise(changelogsDir)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    if (mdFiles.length === 0) {
      this.context.stdout.write('No changelog drafts found. Nothing to apply.\n')
      return 0
    }

    // Read and group drafts by package name
    const drafts: ChangelogDraft[] = []
    const validationErrors: string[] = []

    for (const mdFile of mdFiles) {
      const draftPath = ppath.join(changelogsDir, mdFile)
      const content = await xfs.readFilePromise(draftPath, 'utf8')
      const parsed = parseChangelogDraft(content)

      // Validate the draft before processing
      const validation = validateDraftForApply(parsed.packageName, mdFile)
      if (!validation.isValid) {
        validationErrors.push(...validation.errors)
        continue // Skip invalid drafts - don't add to processing list
      }

      drafts.push({
        path: draftPath,
        filename: mdFile,
        packageName: parsed.packageName,
        content,
      })
    }

    // Report validation errors
    if (validationErrors.length > 0) {
      this.context.stderr.write('Validation errors found:\n')
      for (const error of validationErrors) {
        this.context.stderr.write(`  ✗ ${error}\n`)
      }
      this.context.stderr.write('\nInvalid drafts were skipped and not deleted.\n\n')
    }

    // Group by package name
    const byPackage = new Map<string, ChangelogDraft[]>()
    for (const draft of drafts) {
      const existing = byPackage.get(draft.packageName) ?? []
      existing.push(draft)
      byPackage.set(draft.packageName, existing)
    }

    const today = new Date().toISOString().split('T')[0]
    let appliedCount = 0

    for (const [packageName, packageDrafts] of byPackage) {
      // Find the workspace for this package
      const workspace = project.workspaces.find((ws) => ws.manifest.raw.name === packageName)

      let packageDir: PortablePath
      let version: string

      if (workspace) {
        packageDir = workspace.cwd
        version = workspace.manifest.version ?? DEFAULT_VERSION
      } else {
        // Fallback: derive path from package name
        const shortName = packageName.replace(/^@[^/]+\//, '')
        packageDir = ppath.join(project.cwd, `packages/${shortName}` as PortablePath)

        // Try to read version from package.json
        const pkgJsonPath = ppath.join(packageDir, 'package.json' as PortablePath)
        if (await xfs.existsPromise(pkgJsonPath)) {
          const pkgJson = JSON.parse(await xfs.readFilePromise(pkgJsonPath, 'utf8')) as { version?: string }
          version = pkgJson.version ?? DEFAULT_VERSION
        } else {
          version = DEFAULT_VERSION
        }
      }

      // Verify that the package directory exists before attempting to write changelog
      if (!(await xfs.existsPromise(packageDir))) {
        throw new Error(
          `Package directory not found: ${packageDir}\n` +
            `Package '${packageName}' has changelog entries but no workspace directory exists.\n` +
            `This may indicate the package was deleted or uses a non-standard directory structure.`,
        )
      }

      const changelogPath = ppath.join(packageDir, 'CHANGELOG.md' as PortablePath)

      // Read existing changelog or create header
      let existingContent = ''
      if (await xfs.existsPromise(changelogPath)) {
        existingContent = await xfs.readFilePromise(changelogPath, 'utf8')
      }

      // Parse all drafts and merge them with deduplication
      const parsedDrafts = packageDrafts.map((draft) => parseChangelogDraft(draft.content))
      const mergedChangelog = mergeChangelogs(parsedDrafts)
      const newEntries = formatChangelogEntry(mergedChangelog, version, today)

      // Compose new changelog
      let newContent: string
      const headerPattern = new RegExp(`^${CHANGELOG_HEADER}(?:\\r?\\n)+`)
      if (existingContent) {
        // Insert after the header (# Changelog)
        const headerMatch = existingContent.match(headerPattern)
        if (headerMatch) {
          const headerEnd = headerMatch[0].length
          newContent = existingContent.slice(0, headerEnd) + newEntries + existingContent.slice(headerEnd)
        } else {
          newContent = `${CHANGELOG_HEADER}\n\n${newEntries}${existingContent}`
        }
      } else {
        newContent = `${CHANGELOG_HEADER}\n\n${newEntries}`
      }

      this.context.stdout.write(`Applying ${packageDrafts.length} entry(ies) to ${packageName}\n`)

      if (!this.dryRun) {
        await xfs.writeFilePromise(changelogPath, newContent)

        // Delete processed draft files
        for (const draft of packageDrafts) {
          await xfs.unlinkPromise(draft.path)
          if (this.verbose) {
            this.context.stdout.write(`  Deleted: ${draft.filename}\n`)
          }
        }
      } else if (this.verbose) {
        this.context.stdout.write(`  Would write to: ${changelogPath}\n`)
        for (const draft of packageDrafts) {
          this.context.stdout.write(`  Would delete: ${draft.filename}\n`)
        }
      }

      appliedCount += packageDrafts.length
    }

    const action = this.dryRun ? 'Would apply' : 'Applied'
    this.context.stdout.write(`\n${action} ${appliedCount} changelog entry(ies) to ${byPackage.size} package(s).\n`)

    // Return error exit code if there were validation errors
    if (validationErrors.length > 0) {
      return 1
    }

    return 0
  }
}
