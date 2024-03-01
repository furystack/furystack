import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../components/monaco-editor.js'

export const MonacoEditorPage = Shade({
  shadowDomName: 'monaco-editor-page',
  style: { position: 'fixed', top: '64px', height: 'calc(100% - 96px)', width: 'calc(100% - 48px)' },
  render: () => {
    return (
      <>
        <h1>Monaco Editor</h1>
        <MonacoEditor
          options={{
            language: 'typescript',
            theme: 'vs-dark',
            automaticLayout: true,
          }}
        />
      </>
    )
  },
})
