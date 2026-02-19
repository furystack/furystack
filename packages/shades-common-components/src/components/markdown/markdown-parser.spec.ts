import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, toggleCheckbox } from './markdown-parser.js'

describe('parseInline', () => {
  it('should parse plain text', () => {
    const result = parseInline('hello world')
    expect(result).toEqual([{ type: 'text', content: 'hello world' }])
  })

  it('should parse inline code', () => {
    const result = parseInline('use `const x = 1` here')
    expect(result).toEqual([
      { type: 'text', content: 'use ' },
      { type: 'code', content: 'const x = 1' },
      { type: 'text', content: ' here' },
    ])
  })

  it('should parse bold with **', () => {
    const result = parseInline('this is **bold** text')
    expect(result).toEqual([
      { type: 'text', content: 'this is ' },
      { type: 'bold', children: [{ type: 'text', content: 'bold' }] },
      { type: 'text', content: ' text' },
    ])
  })

  it('should parse italic with *', () => {
    const result = parseInline('this is *italic* text')
    expect(result).toEqual([
      { type: 'text', content: 'this is ' },
      { type: 'italic', children: [{ type: 'text', content: 'italic' }] },
      { type: 'text', content: ' text' },
    ])
  })

  it('should parse bold+italic with ***', () => {
    const result = parseInline('this is ***bold italic*** text')
    expect(result).toEqual([
      { type: 'text', content: 'this is ' },
      { type: 'bold', children: [{ type: 'italic', children: [{ type: 'text', content: 'bold italic' }] }] },
      { type: 'text', content: ' text' },
    ])
  })

  it('should parse links', () => {
    const result = parseInline('click [here](https://example.com) now')
    expect(result).toEqual([
      { type: 'text', content: 'click ' },
      { type: 'link', href: 'https://example.com', children: [{ type: 'text', content: 'here' }] },
      { type: 'text', content: ' now' },
    ])
  })

  it('should parse images', () => {
    const result = parseInline('see ![alt text](image.png) here')
    expect(result).toEqual([
      { type: 'text', content: 'see ' },
      { type: 'image', src: 'image.png', alt: 'alt text' },
      { type: 'text', content: ' here' },
    ])
  })

  it('should parse nested bold in link', () => {
    const result = parseInline('[**bold link**](url)')
    expect(result).toEqual([
      {
        type: 'link',
        href: 'url',
        children: [{ type: 'bold', children: [{ type: 'text', content: 'bold link' }] }],
      },
    ])
  })

  it('should handle empty string', () => {
    expect(parseInline('')).toEqual([])
  })
})

describe('parseMarkdown', () => {
  it('should return empty array for empty input', () => {
    expect(parseMarkdown('')).toEqual([])
  })

  it('should parse headings level 1–6', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
    const result = parseMarkdown(md)
    expect(result).toHaveLength(6)
    for (let i = 0; i < 6; i++) {
      expect(result[i]).toMatchObject({ type: 'heading', level: i + 1 })
    }
  })

  it('should parse a paragraph', () => {
    const result = parseMarkdown('Hello world\nthis is a paragraph.')
    expect(result).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', content: 'Hello world this is a paragraph.' }],
      },
    ])
  })

  it('should split paragraphs on blank lines', () => {
    const result = parseMarkdown('First paragraph.\n\nSecond paragraph.')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ type: 'paragraph' })
    expect(result[1]).toMatchObject({ type: 'paragraph' })
  })

  it('should parse fenced code blocks', () => {
    const md = '```typescript\nconst x = 1\nconsole.log(x)\n```'
    const result = parseMarkdown(md)
    expect(result).toEqual([
      {
        type: 'codeBlock',
        language: 'typescript',
        content: 'const x = 1\nconsole.log(x)',
      },
    ])
  })

  it('should parse fenced code blocks without language', () => {
    const md = '```\nhello\n```'
    const result = parseMarkdown(md)
    expect(result).toEqual([
      {
        type: 'codeBlock',
        language: undefined,
        content: 'hello',
      },
    ])
  })

  it('should parse horizontal rules', () => {
    for (const rule of ['---', '***', '___', '----', '****']) {
      const result = parseMarkdown(rule)
      expect(result).toEqual([{ type: 'horizontalRule' }])
    }
  })

  it('should parse unordered lists', () => {
    const md = '- Item 1\n- Item 2\n- Item 3'
    const result = parseMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'list', ordered: false })
    const list = result[0] as { type: 'list'; items: unknown[] }
    expect(list.items).toHaveLength(3)
  })

  it('should parse ordered lists', () => {
    const md = '1. First\n2. Second\n3. Third'
    const result = parseMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'list', ordered: true })
    const list = result[0] as { type: 'list'; items: unknown[] }
    expect(list.items).toHaveLength(3)
  })

  it('should parse checkboxes in unordered lists', () => {
    const md = '- [x] Done task\n- [ ] Todo task\n- Regular item'
    const result = parseMarkdown(md)
    expect(result).toHaveLength(1)
    const list = result[0] as { type: 'list'; items: Array<{ checkbox?: string }> }
    expect(list.items[0].checkbox).toBe('checked')
    expect(list.items[1].checkbox).toBe('unchecked')
    expect(list.items[2].checkbox).toBeUndefined()
  })

  it('should track sourceLineIndex on list items', () => {
    const md = '- [x] Done\n- [ ] Todo'
    const result = parseMarkdown(md)
    const list = result[0] as { type: 'list'; items: Array<{ sourceLineIndex: number }> }
    expect(list.items[0].sourceLineIndex).toBe(0)
    expect(list.items[1].sourceLineIndex).toBe(1)
  })

  it('should parse blockquotes', () => {
    const md = '> This is a quote\n> Second line'
    const result = parseMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'blockquote' })
    const bq = result[0] as { type: 'blockquote'; children: unknown[] }
    expect(bq.children).toHaveLength(1)
    expect(bq.children[0]).toMatchObject({ type: 'paragraph' })
  })

  it('should parse a complex document', () => {
    const md = [
      '# Title',
      '',
      'A paragraph with **bold** and *italic*.',
      '',
      '## List Section',
      '',
      '- [x] Task done',
      '- [ ] Task pending',
      '',
      '> A blockquote',
      '',
      '---',
      '',
      '```js',
      'console.log("hi")',
      '```',
    ].join('\n')

    const result = parseMarkdown(md)
    expect(result[0]).toMatchObject({ type: 'heading', level: 1 })
    expect(result[1]).toMatchObject({ type: 'paragraph' })
    expect(result[2]).toMatchObject({ type: 'heading', level: 2 })
    expect(result[3]).toMatchObject({ type: 'list', ordered: false })
    expect(result[4]).toMatchObject({ type: 'blockquote' })
    expect(result[5]).toMatchObject({ type: 'horizontalRule' })
    expect(result[6]).toMatchObject({ type: 'codeBlock', language: 'js' })
  })
})

describe('toggleCheckbox', () => {
  it('should toggle an unchecked checkbox to checked', () => {
    const source = '- [ ] Todo item'
    const result = toggleCheckbox(source, 0)
    expect(result).toBe('- [x] Todo item')
  })

  it('should toggle a checked checkbox to unchecked', () => {
    const source = '- [x] Done item'
    const result = toggleCheckbox(source, 0)
    expect(result).toBe('- [ ] Done item')
  })

  it('should toggle the correct line in a multi-line document', () => {
    const source = '- [x] Done\n- [ ] Todo\n- [ ] Another'
    const result = toggleCheckbox(source, 1)
    expect(result).toBe('- [x] Done\n- [x] Todo\n- [ ] Another')
  })

  it('should return original string for out-of-bounds index', () => {
    const source = '- [ ] Todo'
    expect(toggleCheckbox(source, 5)).toBe(source)
    expect(toggleCheckbox(source, -1)).toBe(source)
  })

  it('should return original string for non-checkbox line', () => {
    const source = 'Regular text'
    expect(toggleCheckbox(source, 0)).toBe(source)
  })
})
