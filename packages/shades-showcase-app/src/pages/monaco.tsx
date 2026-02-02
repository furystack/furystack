import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../components/monaco-editor.js'

export const MonacoEditorPage = Shade({
  shadowDomName: 'monaco-editor-page',
  css: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 100px)',
  },
  render: () => {
    return (
      <>
        <h1 style={{ margin: '0 0 16px 0' }}>Monaco Editor</h1>
        <MonacoEditor
          style={{ flex: '1', minHeight: '0' }}
          options={{
            language: 'typescript',
            automaticLayout: true,
          }}
        />
      </>
    )
  },
})
