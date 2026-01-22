import type { ChangelogSection, ParsedChangelog } from './types';

/**
 * Default version type when not specified
 */
const DEFAULT_VERSION_TYPE = 'patch' as const;

/**
 * Placeholder comment prefix used in changelog templates
 */
const PLACEHOLDER_PREFIX = '<!-- PLACEHOLDER:';

/**
 * Version type comment regex pattern
 */
const VERSION_TYPE_COMMENT_PATTERN = /<!-- version-type: (\w+) -->/;

/**
 * Package name heading regex pattern
 */
const PACKAGE_NAME_HEADING_PATTERN = /^# (.+)$/m;

/**
 * Section heading regex pattern
 */
const SECTION_HEADING_PATTERN = /^## (.+)$/;

// Re-export types for backwards compatibility
export type { ChangelogSection, ChunkType, ParsedChangelog, ValidateChangelogOptions } from './types';

// Re-export functions from new modules for backwards compatibility
export { formatChangelogEntry } from './changelogFormatter';
export { mergeChangelogs } from './changelogMerger';
export { validateChangelog } from './changelogValidator';
export { classifyChunk, formatMergedChunks } from './chunkUtils';

/**
 * Parse a changelog draft file
 * @param content - The raw markdown content of the changelog draft
 * @returns Parsed changelog structure
 */
export function parseChangelogDraft(content: string): ParsedChangelog {
  const lines = content.split('\n');

  // Extract version type from comment
  const versionTypeMatch = content.match(VERSION_TYPE_COMMENT_PATTERN);
  const versionType = versionTypeMatch?.[1] ?? DEFAULT_VERSION_TYPE;

  // Extract package name from heading
  const packageNameMatch = content.match(PACKAGE_NAME_HEADING_PATTERN);
  const packageName = packageNameMatch?.[1] ?? '';

  // Check for placeholder comments
  const hasPlaceholders = content.includes(PLACEHOLDER_PREFIX);

  // Parse sections
  const sections: ChangelogSection[] = [];
  let currentSection: ChangelogSection | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(SECTION_HEADING_PATTERN);
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        name: sectionMatch[1],
        content: '',
        isEmpty: true,
      };
    } else if (currentSection && !line.trim().startsWith('<!--')) {
      currentSection.content += `${line}\n`;
      if (line.trim()) {
        currentSection.isEmpty = false;
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    packageName,
    versionType,
    sections,
    hasPlaceholders,
  };
}
