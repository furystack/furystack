import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { MonacoEditor } from '../components/monaco-editor.js'

export const MonacoEditorPage = Shade({
  shadowDomName: 'monaco-editor-page',
  css: { height: '100%', boxSizing: 'border-box', padding: '16px', display: 'block' },
  render: () => {
    return (
      <Paper
        elevation={3}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', padding: '16px' }}
      >
        <h1 style={{ margin: '0 0 16px 0' }}>Monaco Editor</h1>
        <MonacoEditor
          style={{ flex: '1', minHeight: '0' }}
          options={{
            language: 'typescript',
            automaticLayout: true,
          }}
        />
      </Paper>
    )
  },
})
