/**
 * Type of content a chunk starts with, used for sorting
 */
export type ChunkType = 'heading' | 'list' | 'other'

/**
 * A changelog section (✨ Features, 🐛 Bug Fixes, etc.)
 */
export type ChangelogSection = {
  /** Section name including emoji (e.g., "✨ Features") */
  name: string
  /** Section content (typically markdown list items) */
  content: string
  /** Whether the section has no content */
  isEmpty: boolean
}

/**
 * Parsed changelog draft
 */
export type ParsedChangelog = {
  /** The npm package name (e.g., "@furystack/core") */
  packageName: string
  /** The type of version change (patch, minor, major) */
  versionType: string
  /** Array of changelog sections */
  sections: ChangelogSection[]
  /** Whether the changelog contains unfilled placeholder comments */
  hasPlaceholders: boolean
}

/**
 * Options for changelog validation
 */
export type ValidateChangelogOptions = {
  /**
   * Expected version type from the manifest. If provided, validates that the
   * changelog's version-type comment matches this value.
   */
  expectedVersionType?: string
}

/**
 * Result of validating a parsed changelog draft for the apply command
 */
export type DraftValidationResult = {
  /** Whether the draft is valid and can be applied */
  isValid: boolean
  /** Error messages if validation failed */
  errors: string[]
}

/**
 * Result of analyzing an existing changelog for regeneration
 */
export type ChangelogAnalysis = {
  /** Whether the changelog should be regenerated */
  shouldRegenerate: boolean
  /** Whether there is a version type mismatch */
  hasVersionMismatch: boolean
  /** Content validation errors (excludes version mismatch) */
  contentErrors: string[]
}
