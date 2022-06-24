import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../components/monaco-editor'

export const MonacoEditorPage = Shade({
  shadowDomName: 'monaco-editor-page',
  render: () => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '64px',
          height: 'calc(100% - 96px)',
          width: 'calc(100% - 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignContent: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1>Monaco Editor</h1>
        <MonacoEditor
          options={{
            language: 'json',
            theme: 'vs-dark',
            automaticLayout: true,
          }}
        />
      </div>
    )
  },
})
