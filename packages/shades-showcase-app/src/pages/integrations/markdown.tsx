import { createComponent, Shade } from '@furystack/shades'
import type { MarkdownEditorLayout } from '@furystack/shades-common-components'
import {
  Button,
  ButtonGroup,
  Icon,
  icons,
  MarkdownDisplay,
  MarkdownEditor,
  MarkdownInput,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const sampleMarkdown = `# Markdown Components

This is a **live demo** of the custom Markdown components built with *FuryStack Shades*.

## Features

- **Bold** and *italic* text formatting
- Inline \`code\` snippets
- [Links](https://github.com/furystack/furystack) to external resources
- Images and embedded content

### Code Blocks

\`\`\`typescript
const greeting = 'Hello, Markdown!'
console.log(greeting)
\`\`\`

### Blockquote

> FuryStack is a flexible full-stack framework
> built with TypeScript and dependency injection.

---

### Ordered List

1. First item
2. Second item
3. Third item
`

const checkboxSample = `## Task List

Track progress by toggling checkboxes:

- [x] Implement Markdown parser
- [x] Build MarkdownDisplay component
- [x] Build MarkdownInput component
- [ ] Build MarkdownEditor component
- [ ] Write unit tests
- [ ] Add E2E tests
- [ ] Update documentation
`

export const MarkdownPage = Shade({
  shadowDomName: 'shades-markdown-page',
  render: ({ useDisposable, useObservable }) => {
    const interactiveContent = useDisposable('interactiveContent', () => new ObservableValue(checkboxSample))
    const [currentContent] = useObservable('currentContent', interactiveContent)

    const editorContent = useDisposable('editorContent', () => new ObservableValue(sampleMarkdown))
    const [currentEditorContent] = useObservable('editorContent', editorContent)

    const editorLayout = useDisposable('editorLayout', () => new ObservableValue<MarkdownEditorLayout>('side-by-side'))
    const [currentLayout] = useObservable('editorLayout', editorLayout)

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.fileText} />}
          title="Markdown"
          description="Custom Markdown components for rendering and editing Markdown content. Includes a display renderer, a text input with image paste support, and a combined editor with multiple layout modes."
        />

        <Paper elevation={3} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Typography variant="h3">MarkdownDisplay</Typography>
          <Typography variant="body2" color="textSecondary">
            Renders Markdown content using FuryStack components. Supports headings, lists, code blocks, blockquotes,
            links, images, and more.
          </Typography>
          <MarkdownDisplay content={sampleMarkdown} />
        </Paper>

        <Paper elevation={3} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Typography variant="h3">Interactive Checkboxes</Typography>
          <Typography variant="body2" color="textSecondary">
            Checkboxes can be toggled when readOnly is false. Click any checkbox below to see the Markdown source update
            in real time.
          </Typography>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1', minWidth: '280px' }}>
              <MarkdownDisplay
                content={currentContent}
                readOnly={false}
                onChange={(newContent) => interactiveContent.setValue(newContent)}
              />
            </div>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Raw Markdown source:
              </Typography>
              <pre
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  margin: '0',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                {currentContent}
              </pre>
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Typography variant="h3">MarkdownInput</Typography>
          <Typography variant="body2" color="textSecondary">
            A textarea for Markdown content. Paste an image from the clipboard and it will be inlined as a
            base64-encoded Markdown image (up to 256KB by default).
          </Typography>
          <MarkdownInput
            value={currentEditorContent}
            onValueChange={(v) => editorContent.setValue(v)}
            placeholder="Type or paste Markdown here..."
            labelTitle="Markdown Source"
            rows={8}
          />
        </Paper>

        <Paper elevation={3} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <Typography variant="h3" style={{ margin: '0' }}>
              MarkdownEditor
            </Typography>
            <ButtonGroup>
              <Button
                variant={currentLayout === 'side-by-side' ? 'contained' : 'outlined'}
                size="small"
                onclick={() => editorLayout.setValue('side-by-side')}
              >
                Side by Side
              </Button>
              <Button
                variant={currentLayout === 'tabs' ? 'contained' : 'outlined'}
                size="small"
                onclick={() => editorLayout.setValue('tabs')}
              >
                Tabs
              </Button>
              <Button
                variant={currentLayout === 'above-below' ? 'contained' : 'outlined'}
                size="small"
                onclick={() => editorLayout.setValue('above-below')}
              >
                Above / Below
              </Button>
            </ButtonGroup>
          </div>
          <Typography variant="body2" color="textSecondary">
            Combined editor with input and live preview. Checkboxes in the preview pane are always interactive.
          </Typography>
          <MarkdownEditor
            value={currentEditorContent}
            onValueChange={(v) => editorContent.setValue(v)}
            layout={currentLayout}
            style={{ flex: '1', minHeight: '0' }}
          />
        </Paper>
      </PageContainer>
    )
  },
})
