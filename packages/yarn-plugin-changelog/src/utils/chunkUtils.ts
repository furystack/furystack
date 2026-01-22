import type { ChunkType } from './types'

/**
 * Priority values for chunk types (lower = appears first)
 */
const CHUNK_TYPE_PRIORITY: Record<ChunkType, number> = {
  heading: 1,
  other: 2,
  list: 3,
} as const

/**
 * Classify a chunk based on its first non-empty line
 * @param content - The chunk content
 * @returns The chunk type
 */
export function classifyChunk(content: string): ChunkType {
  const trimmed = content.trim()
  if (!trimmed) return 'other'

  const firstLine = trimmed.split('\n')[0].trim()

  // Check for sub-headings (###, ####, etc.)
  if (/^#{2,}/.test(firstLine)) return 'heading'

  // Check for list items (-, *, +, or numbered lists like "1.")
  if (/^[-*+]/.test(firstLine) || /^\d+\./.test(firstLine)) return 'list'

  return 'other'
}

/**
 * Check if a line is a list item (including nested)
 * @param line - The line to check
 * @returns True if the line is a list item
 */
export function isListItem(line: string): boolean {
  const trimmed = line.trim()
  return /^[-*+]/.test(trimmed) || /^\d+\./.test(trimmed)
}

/**
 * Format merged chunks with proper markdown spacing
 * - Heading chunks appear first
 * - List-only chunks are joined at the bottom without empty lines between items
 * - Single blank line between different chunk types
 * @param chunks - Array of chunk contents
 * @returns Formatted merged content
 */
export function formatMergedChunks(chunks: string[]): string {
  if (chunks.length === 0) return ''

  // Classify and sort chunks
  const classifiedChunks = chunks.map((content) => ({
    content: content.trim(),
    type: classifyChunk(content),
  }))

  // Stable sort by chunk type priority
  classifiedChunks.sort((a, b) => CHUNK_TYPE_PRIORITY[a.type] - CHUNK_TYPE_PRIORITY[b.type])

  // Separate list-only chunks from others
  const nonListChunks = classifiedChunks.filter((c) => c.type !== 'list')
  const listChunks = classifiedChunks.filter((c) => c.type === 'list')

  const parts: string[] = []

  // Add non-list chunks with blank lines between them
  for (const chunk of nonListChunks) {
    parts.push(chunk.content)
  }

  // Join list-only chunks: extract all list items and join without empty lines
  if (listChunks.length > 0) {
    const allListItems: string[] = []

    for (const chunk of listChunks) {
      const lines = chunk.content.split('\n')
      for (const line of lines) {
        // Keep all lines that are list items or indented continuation
        if (line.trim() && (isListItem(line) || /^\s+/.test(line))) {
          allListItems.push(line)
        }
      }
    }

    if (allListItems.length > 0) {
      parts.push(allListItems.join('\n'))
    }
  }

  // Join all parts with double newlines (single blank line between them)
  return parts.join('\n\n')
}
