import { BaseCommand } from '@yarnpkg/cli';
import { Configuration, Project } from '@yarnpkg/core';
import type { PortablePath } from '@yarnpkg/fslib';
import { ppath, xfs } from '@yarnpkg/fslib';
import { Command, Option } from 'clipanion';

import { parseChangelogDraft, validateChangelog } from '../utils/changelogParser';
import { CHANGELOGS_DIR, VERSIONS_DIR } from '../utils/directoryPaths';
import { generateChangelogFilename } from '../utils/changelogTemplates';
import { parseVersionManifest } from '../utils/parseVersionManifest';

/**
 * Command to validate changelog entries against version manifests.
 *
 * Ensures all version entries have valid, non-placeholder changelog entries.
 */
export class CheckCommand extends BaseCommand {
  static override paths = [['changelog', 'check']];

  static override usage = Command.Usage({
    description: 'Validate changelog entries for all version manifests',
    details: `
      This command validates that:
      - Every release in \`.yarn/versions/*.yml\` has a changelog file
      - Major releases have filled BREAKING CHANGES sections
      - At least one section (Added/Changed/Fixed) has content
    `,
    examples: [['Validate changelogs', 'yarn changelog check']],
  });

  verbose = Option.Boolean('-v,--verbose', false, {
    description: 'Show verbose output',
  });

  /**
   * Execute the command
   */
  public async execute(): Promise<number> {
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
    const { project } = await Project.find(configuration, this.context.cwd);

    const versionsDir = ppath.join(project.cwd, VERSIONS_DIR as PortablePath);
    const changelogsDir = ppath.join(project.cwd, CHANGELOGS_DIR as PortablePath);

    // Check if versions directory exists
    if (!(await xfs.existsPromise(versionsDir))) {
      this.context.stdout.write('No .yarn/versions directory found. Nothing to check.\n');
      return 0;
    }

    // Read all version manifest files
    const files = await xfs.readdirPromise(versionsDir);
    const ymlFiles = files.filter((f) => f.endsWith('.yml'));

    if (ymlFiles.length === 0) {
      this.context.stdout.write('No version manifests found. Nothing to check.\n');
      return 0;
    }

    const errors: string[] = [];
    let checkedCount = 0;

    for (const ymlFile of ymlFiles) {
      const manifestPath = ppath.join(versionsDir, ymlFile);
      const content = await xfs.readFilePromise(manifestPath, 'utf8');
      const manifest = parseVersionManifest(content, manifestPath);

      if (this.verbose) {
        this.context.stdout.write(`Checking manifest: ${ymlFile}\n`);
      }

      for (const release of manifest.releases) {
        const filename = generateChangelogFilename(release.packageName, manifest.id);
        const changelogPath = ppath.join(changelogsDir, filename as PortablePath);

        // Check if changelog file exists
        if (!(await xfs.existsPromise(changelogPath))) {
          errors.push(
            `Missing changelog for ${release.packageName} (manifest: ${manifest.id}). ` +
              `Run 'yarn changelog create' to generate it.`,
          );
          continue;
        }

        // Read and parse the changelog
        const changelogContent = await xfs.readFilePromise(changelogPath, 'utf8');
        const changelog = parseChangelogDraft(changelogContent);

        // Validate the changelog
        const validationErrors = validateChangelog(changelog, {
          expectedVersionType: release.versionType,
        });

        if (validationErrors.length > 0) {
          for (const error of validationErrors) {
            errors.push(`${release.packageName} (${filename}): ${error}`);
          }
        } else if (this.verbose) {
          this.context.stdout.write(`  ✓ ${release.packageName}\n`);
        }

        checkedCount++;
      }
    }

    if (errors.length > 0) {
      this.context.stderr.write('\nChangelog validation failed:\n\n');
      for (const error of errors) {
        this.context.stderr.write(`  ✗ ${error}\n`);
      }
      this.context.stderr.write(`\nFound ${errors.length} error(s).\n`);
      return 1;
    }

    this.context.stdout.write(`\n✓ All ${checkedCount} changelog(s) are valid.\n`);

    return 0;
  }
}
