import { describe, expect, it } from 'vitest'
import { classifyChunk, formatMergedChunks, isListItem } from './chunkUtils'

describe('classifyChunk', () => {
  describe('empty or whitespace content', () => {
    it('should return "other" for empty string', () => {
      expect(classifyChunk('')).toBe('other')
    })

    it('should return "other" for whitespace only', () => {
      expect(classifyChunk('   ')).toBe('other')
      expect(classifyChunk('\n\n')).toBe('other')
      expect(classifyChunk('\t\t')).toBe('other')
    })
  })

  describe('heading detection', () => {
    it('should classify h2 headings', () => {
      expect(classifyChunk('## Section Title')).toBe('heading')
    })

    it('should classify h3 headings', () => {
      expect(classifyChunk('### Subsection')).toBe('heading')
    })

    it('should classify h4+ headings', () => {
      expect(classifyChunk('#### Deep Heading')).toBe('heading')
      expect(classifyChunk('##### Even Deeper')).toBe('heading')
    })

    it('should classify heading with content after', () => {
      expect(classifyChunk('### Feature Name\n\nDescription of the feature.')).toBe('heading')
    })
  })

  describe('list detection', () => {
    it('should classify dash list items', () => {
      expect(classifyChunk('- Item one')).toBe('list')
    })

    it('should classify asterisk list items', () => {
      expect(classifyChunk('* Item one')).toBe('list')
    })

    it('should classify plus list items', () => {
      expect(classifyChunk('+ Item one')).toBe('list')
    })

    it('should classify numbered list items', () => {
      expect(classifyChunk('1. First item')).toBe('list')
      expect(classifyChunk('10. Tenth item')).toBe('list')
    })

    it('should classify list with multiple items', () => {
      expect(classifyChunk('- Item one\n- Item two\n- Item three')).toBe('list')
    })
  })

  describe('other content', () => {
    it('should classify plain text as "other"', () => {
      expect(classifyChunk('Just some text')).toBe('other')
    })

    it('should classify paragraphs as "other"', () => {
      expect(classifyChunk('This is a paragraph.\n\nThis is another paragraph.')).toBe('other')
    })

    it('should classify code blocks as "other"', () => {
      expect(classifyChunk('```typescript\nconst x = 1;\n```')).toBe('other')
    })
  })
})

describe('isListItem', () => {
  describe('dash lists', () => {
    it('should return true for dash list items', () => {
      expect(isListItem('- Item')).toBe(true)
    })

    it('should return true for dash with leading whitespace', () => {
      expect(isListItem('  - Nested item')).toBe(true)
    })
  })

  describe('asterisk lists', () => {
    it('should return true for asterisk list items', () => {
      expect(isListItem('* Item')).toBe(true)
    })
  })

  describe('plus lists', () => {
    it('should return true for plus list items', () => {
      expect(isListItem('+ Item')).toBe(true)
    })
  })

  describe('numbered lists', () => {
    it('should return true for numbered list items', () => {
      expect(isListItem('1. First')).toBe(true)
      expect(isListItem('99. Ninety-ninth')).toBe(true)
    })
  })

  describe('non-list content', () => {
    it('should return false for plain text', () => {
      expect(isListItem('Just text')).toBe(false)
    })

    it('should return false for headings', () => {
      expect(isListItem('## Heading')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isListItem('')).toBe(false)
    })
  })
})

describe('formatMergedChunks', () => {
  describe('empty input', () => {
    it('should return empty string for empty array', () => {
      expect(formatMergedChunks([])).toBe('')
    })
  })

  describe('single chunk', () => {
    it('should return trimmed content for single heading chunk', () => {
      expect(formatMergedChunks(['### Feature\n\nDescription'])).toBe('### Feature\n\nDescription')
    })

    it('should return trimmed content for single list chunk', () => {
      expect(formatMergedChunks(['- Item one\n- Item two'])).toBe('- Item one\n- Item two')
    })
  })

  describe('multiple chunks of same type', () => {
    it('should join list chunks without extra blank lines between items', () => {
      const result = formatMergedChunks(['- Item one', '- Item two', '- Item three'])

      expect(result).toBe('- Item one\n- Item two\n- Item three')
    })

    it('should join heading chunks with blank lines', () => {
      const result = formatMergedChunks(['### Feature A\n\nDescription A', '### Feature B\n\nDescription B'])

      expect(result).toBe('### Feature A\n\nDescription A\n\n### Feature B\n\nDescription B')
    })
  })

  describe('mixed chunk types', () => {
    it('should sort heading chunks before list chunks', () => {
      const result = formatMergedChunks(['- List item', '### Heading\n\nContent'])

      expect(result.indexOf('### Heading')).toBeLessThan(result.indexOf('- List item'))
    })

    it('should sort other chunks before list chunks', () => {
      const result = formatMergedChunks(['- List item', 'Plain text paragraph'])

      expect(result.indexOf('Plain text paragraph')).toBeLessThan(result.indexOf('- List item'))
    })

    it('should maintain proper spacing between different chunk types', () => {
      const result = formatMergedChunks(['### Feature\n\nDescription', '- Simple item'])

      expect(result).toContain('\n\n')
    })
  })

  describe('whitespace handling', () => {
    it('should trim whitespace from chunks', () => {
      const result = formatMergedChunks(['  - Item with spaces  ', '\n### Heading\n'])

      expect(result).not.toMatch(/^\s/)
      expect(result).not.toMatch(/\s$/)
    })

    it('should filter out empty chunks when trimmed', () => {
      const result = formatMergedChunks(['- Item one', '- Item two'])

      expect(result).not.toContain('\n\n\n')
    })
  })

  describe('nested list items', () => {
    it('should preserve nested list structure', () => {
      const result = formatMergedChunks(['- Parent\n  - Child'])

      expect(result).toContain('- Parent')
      expect(result).toContain('  - Child')
    })

    it('should combine nested lists from multiple chunks', () => {
      const result = formatMergedChunks(['- Item 1\n  - Nested 1', '- Item 2\n  - Nested 2'])

      expect(result).toContain('- Item 1')
      expect(result).toContain('  - Nested 1')
      expect(result).toContain('- Item 2')
      expect(result).toContain('  - Nested 2')
    })
  })
})
