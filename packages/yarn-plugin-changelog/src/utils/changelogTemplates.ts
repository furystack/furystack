import { CHANGELOG_SECTIONS } from './changelogSections';
import { sanitizePackageName, type VersionType } from './parseVersionManifest';

/**
 * Default changelog entry message for dependency updates
 */
const DEFAULT_DEPENDENCY_MESSAGE = 'Updated dependencies';

/**
 * Formatting guide shown at the top of changelog templates.
 * Explains the two supported formats and how they are merged.
 */
const FORMATTING_GUIDE = `<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->`;

/**
 * Placeholder messages for each changelog section
 */
const SECTION_PLACEHOLDERS: Record<string, string> = {
  [CHANGELOG_SECTIONS.BREAKING_CHANGES]: 'Describe breaking changes (BREAKING CHANGE:)',
  [CHANGELOG_SECTIONS.DEPRECATED]:
    'Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag.',
  [CHANGELOG_SECTIONS.FEATURES]: 'Describe your shiny new features (feat:)',
  [CHANGELOG_SECTIONS.BUG_FIXES]: 'Describe the nasty little bugs that has been eradicated (fix:)',
  [CHANGELOG_SECTIONS.DOCUMENTATION]: 'Describe documentation changes (docs:)',
  [CHANGELOG_SECTIONS.PERFORMANCE]: 'Describe performance improvements (perf:)',
  [CHANGELOG_SECTIONS.REFACTORING]: 'Describe code refactoring (refactor:)',
  [CHANGELOG_SECTIONS.TESTS]: 'Describe test changes (test:)',
  [CHANGELOG_SECTIONS.BUILD]: 'Describe build system changes (build:)',
  [CHANGELOG_SECTIONS.CI]: 'Describe CI configuration changes (ci:)',
  [CHANGELOG_SECTIONS.DEPENDENCIES]: 'Describe dependency updates (deps:)',
  [CHANGELOG_SECTIONS.CHORES]: 'Describe other changes (chore:)',
} as const;

/**
 * Migration guide placeholder for major version breaking changes
 */
const MIGRATION_PLACEHOLDER = '<!-- MIGRATION REQUIRED: Explain how to migrate from the previous version -->';

/**
 * Sections included in major version templates
 */
const MAJOR_VERSION_SECTIONS = [
  CHANGELOG_SECTIONS.BREAKING_CHANGES,
  CHANGELOG_SECTIONS.DEPRECATED,
  CHANGELOG_SECTIONS.FEATURES,
  CHANGELOG_SECTIONS.BUG_FIXES,
  CHANGELOG_SECTIONS.DOCUMENTATION,
  CHANGELOG_SECTIONS.PERFORMANCE,
  CHANGELOG_SECTIONS.REFACTORING,
  CHANGELOG_SECTIONS.TESTS,
  CHANGELOG_SECTIONS.BUILD,
  CHANGELOG_SECTIONS.CI,
  CHANGELOG_SECTIONS.DEPENDENCIES,
  CHANGELOG_SECTIONS.CHORES,
] as const;

/**
 * Sections included in minor version templates
 */
const MINOR_VERSION_SECTIONS = [
  CHANGELOG_SECTIONS.DEPRECATED,
  CHANGELOG_SECTIONS.FEATURES,
  CHANGELOG_SECTIONS.BUG_FIXES,
  CHANGELOG_SECTIONS.DOCUMENTATION,
  CHANGELOG_SECTIONS.PERFORMANCE,
  CHANGELOG_SECTIONS.REFACTORING,
  CHANGELOG_SECTIONS.TESTS,
  CHANGELOG_SECTIONS.BUILD,
  CHANGELOG_SECTIONS.CI,
  CHANGELOG_SECTIONS.DEPENDENCIES,
  CHANGELOG_SECTIONS.CHORES,
] as const;

/**
 * Sections included in patch version templates
 */
const PATCH_VERSION_SECTIONS = [
  CHANGELOG_SECTIONS.FEATURES,
  CHANGELOG_SECTIONS.BUG_FIXES,
  CHANGELOG_SECTIONS.DOCUMENTATION,
  CHANGELOG_SECTIONS.PERFORMANCE,
  CHANGELOG_SECTIONS.REFACTORING,
  CHANGELOG_SECTIONS.TESTS,
  CHANGELOG_SECTIONS.BUILD,
  CHANGELOG_SECTIONS.CI,
  CHANGELOG_SECTIONS.DEPENDENCIES,
  CHANGELOG_SECTIONS.CHORES,
] as const;

/**
 * Build a section string with placeholder comment
 * @param sectionName - The section name with emoji
 * @param includeMigrationPlaceholder - Whether to include the migration placeholder (for breaking changes)
 * @returns Formatted section string
 */
function buildSection(sectionName: string, includeMigrationPlaceholder = false): string {
  const placeholder = SECTION_PLACEHOLDERS[sectionName];
  let section = `## ${sectionName}\n<!-- PLACEHOLDER: ${placeholder} -->`;

  if (includeMigrationPlaceholder) {
    section += `\n${MIGRATION_PLACEHOLDER}`;
  }

  return section;
}

/**
 * Build the sections string for a given version type
 * @param versionType - The version type
 * @returns Formatted sections string
 */
function buildSectionsForVersionType(versionType: VersionType): string {
  const sections =
    versionType === 'major'
      ? MAJOR_VERSION_SECTIONS
      : versionType === 'minor'
        ? MINOR_VERSION_SECTIONS
        : PATCH_VERSION_SECTIONS;

  return sections
    .map((sectionName) => {
      const includeMigration = sectionName === CHANGELOG_SECTIONS.BREAKING_CHANGES;
      return buildSection(sectionName, includeMigration);
    })
    .join('\n\n');
}

/**
 * Generate a changelog draft template based on version type
 * Sections are aligned with conventional commits: https://www.conventionalcommits.org/
 * @param packageName - The npm package name
 * @param versionType - The type of version change (patch, minor, major)
 * @returns The changelog draft template content
 */
export function generateChangelogTemplate(packageName: string, versionType: VersionType): string {
  const sectionsContent = buildSectionsForVersionType(versionType);

  return `<!-- version-type: ${versionType} -->
# ${packageName}

${FORMATTING_GUIDE}

${sectionsContent}
`;
}

/**
 * Generate the filename for a changelog draft
 * @param packageName - The npm package name
 * @param manifestId - The version manifest ID
 * @returns The changelog draft filename
 */
export function generateChangelogFilename(packageName: string, manifestId: string): string {
  const sanitizedName = sanitizePackageName(packageName);
  return `${sanitizedName}.${manifestId}.md`;
}

/**
 * Generate a pre-filled changelog template for Dependabot PRs
 * @param packageName - The npm package name
 * @param versionType - The type of version change (patch, minor, major)
 * @param message - Optional custom message (e.g., PR title). Falls back to "Updated dependencies"
 * @returns The changelog draft template content with pre-filled "Dependencies" section
 */
export function generateDependabotChangelogTemplate(
  packageName: string,
  versionType: VersionType,
  message?: string,
): string {
  const changeMessage = message || DEFAULT_DEPENDENCY_MESSAGE;

  if (versionType === 'major') {
    return `<!-- version-type: ${versionType} -->
# ${packageName}

## ${CHANGELOG_SECTIONS.BREAKING_CHANGES}
- ${changeMessage}

## ${CHANGELOG_SECTIONS.DEPENDENCIES}
- ${changeMessage}
`;
  }

  return `<!-- version-type: ${versionType} -->
# ${packageName}

## ${CHANGELOG_SECTIONS.DEPENDENCIES}
- ${changeMessage}
`;
}
