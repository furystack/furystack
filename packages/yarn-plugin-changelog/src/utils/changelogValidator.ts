import { CHANGELOG_SECTIONS } from './changelogSections'
import type { ChangelogAnalysis, DraftValidationResult, ParsedChangelog, ValidateChangelogOptions } from './types'

/**
 * Validate a parsed changelog
 * @param changelog - The parsed changelog to validate
 * @param options - Validation options
 * @returns Array of validation error messages (empty if valid)
 */
export function validateChangelog(changelog: ParsedChangelog, options: ValidateChangelogOptions = {}): string[] {
  const errors: string[] = []

  if (options.expectedVersionType && changelog.versionType !== options.expectedVersionType) {
    errors.push(
      `Version type mismatch: changelog has "${changelog.versionType}" but manifest expects "${options.expectedVersionType}". ` +
        `Run 'yarn changelog create --force' to regenerate.`,
    )
  }

  if (
    changelog.versionType === 'major' &&
    !changelog.sections.some((s) => s.name === CHANGELOG_SECTIONS.BREAKING_CHANGES && !s.isEmpty)
  ) {
    errors.push(`Major release requires filled "${CHANGELOG_SECTIONS.BREAKING_CHANGES}" section`)
  }

  const contentSections = changelog.sections.filter((s) => !s.isEmpty)

  if (contentSections.length === 0) {
    errors.push('At least one section must have content')
  }

  return errors
}

/**
 * Validate a parsed changelog draft before applying.
 * @param packageName - The package name extracted from the draft
 * @param filename - The filename of the draft (for error messages)
 * @returns Validation result with errors if invalid
 */
export function validateDraftForApply(packageName: string, filename: string): DraftValidationResult {
  const errors: string[] = []

  if (!packageName) {
    errors.push(
      `${filename}: Missing package name heading. ` +
        `Expected a heading like "# @furystack/package-name" at the start of the file.`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Analyze an existing changelog to determine if it should be regenerated.
 *
 * A changelog should be regenerated when:
 * - The version type doesn't match the expected type from the manifest
 * - The changelog has invalid content (empty sections, missing breaking changes for major, etc.)
 * @param changelog - The parsed changelog to analyze
 * @param expectedVersionType - The expected version type from the manifest
 * @returns Analysis result with regeneration decision and reasons
 */
export function analyzeChangelogForRegeneration(
  changelog: ParsedChangelog,
  expectedVersionType: string,
): ChangelogAnalysis {
  const hasVersionMismatch = changelog.versionType !== expectedVersionType
  const validationErrors = validateChangelog(changelog, { expectedVersionType })
  const contentErrors = validationErrors.filter((err) => !err.includes('Version type mismatch'))

  return {
    shouldRegenerate: hasVersionMismatch || contentErrors.length > 0,
    hasVersionMismatch,
    contentErrors,
  }
}
