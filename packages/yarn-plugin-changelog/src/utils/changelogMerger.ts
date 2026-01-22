import { formatMergedChunks } from './chunkUtils'
import type { ChangelogSection, ParsedChangelog } from './types'

/**
 * Priority values for version types (higher = more significant)
 */
const VERSION_TYPE_PRIORITY: Record<string, number> = {
  major: 3,
  minor: 2,
  patch: 1,
} as const

/**
 * Merge multiple parsed changelogs into one, preserving chunks as atomic units.
 * Chunks are sorted by type (headings first, then others, then list-only chunks).
 * Deduplication is case-insensitive but preserves the first occurrence's casing.
 * @param changelogs - Array of parsed changelogs to merge
 * @returns Merged changelog with deduplicated and sorted chunks
 */
export function mergeChangelogs(changelogs: ParsedChangelog[]): ParsedChangelog {
  if (changelogs.length === 0) {
    return {
      packageName: '',
      versionType: 'patch',
      sections: [],
      hasPlaceholders: false,
    }
  }

  if (changelogs.length === 1) {
    return changelogs[0]
  }

  const { packageName } = changelogs[0]
  const hasPlaceholders = changelogs.some((c) => c.hasPlaceholders)

  // Determine highest version type (major > minor > patch)
  const versionType = changelogs.reduce<string>((highest, changelog) => {
    const currentPriority = VERSION_TYPE_PRIORITY[changelog.versionType] ?? 0
    const highestPriority = VERSION_TYPE_PRIORITY[highest] ?? 0
    return currentPriority > highestPriority ? changelog.versionType : highest
  }, 'patch')

  // Collect chunks by section name (each draft's section content is one chunk)
  const chunksBySection = new Map<string, string[]>()
  const sectionOrder: string[] = []

  for (const changelog of changelogs) {
    for (const section of changelog.sections) {
      if (!chunksBySection.has(section.name)) {
        chunksBySection.set(section.name, [])
        sectionOrder.push(section.name)
      }

      const trimmedContent = section.content.trim()
      if (!trimmedContent) continue

      // Check for duplicate chunks (case-insensitive comparison)
      const existingChunks = chunksBySection.get(section.name)!
      const isDuplicate = existingChunks.some(
        (existing) => existing.trim().toLowerCase() === trimmedContent.toLowerCase(),
      )

      if (!isDuplicate) {
        existingChunks.push(trimmedContent)
      }
    }
  }

  // Build merged sections with sorted and formatted chunks
  const sections: ChangelogSection[] = sectionOrder.map((name) => {
    const chunks = chunksBySection.get(name) ?? []
    const content = formatMergedChunks(chunks)
    return {
      name,
      content: content ? `${content}\n` : '',
      isEmpty: !content,
    }
  })

  return {
    packageName,
    versionType,
    sections,
    hasPlaceholders,
  }
}
