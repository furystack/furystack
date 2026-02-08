import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import { MonacoEditor } from '../../components/monaco-editor.js'

export const MonacoEditorPage = Shade({
  tagName: 'monaco-editor-page',
  css: { height: '100%', display: 'block' },
  render: () => {
    return (
      <PageContainer>
        <PageHeader
          icon="💻"
          title="Monaco Editor"
          description="Monaco Editor is the code editor that powers VS Code, integrated here as a Shades component. It provides syntax highlighting, IntelliSense, and full editor features for TypeScript and many other languages. The editor automatically adapts its layout and supports configuration options like language mode and automatic layout resizing."
        />
        <Paper
          elevation={3}
          style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0', padding: '16px' }}
        >
          <MonacoEditor
            style={{ flex: '1', minHeight: '0' }}
            options={{
              language: 'typescript',
              automaticLayout: true,
            }}
          />
        </Paper>
      </PageContainer>
    )
  },
})
