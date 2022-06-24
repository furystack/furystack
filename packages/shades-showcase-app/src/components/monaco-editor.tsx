import { Shade } from '@furystack/shades'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api'
import type { EditorLanguage } from 'monaco-editor/esm/metadata'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl(_moduleId: any, label: EditorLanguage) {
    if (label === 'json') {
      return '/js/monaco-editor/esm/vs/language/json/json.worker.js'
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js'
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js'
    }
    return '/js/monaco-editor/esm/vs/editor.worker.js'
  },
}

editor
  .createWebWorker({
    moduleId: '/js/monaco-editor/esm/vs/language/json/json.worker.js',
    label: 'json',
  })
  .getProxy()

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onchange?: (value: string) => void
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  constructed: ({ element, props }) => {
    const editorInstance = editor.create(element as HTMLElement, props.options)
    editorInstance.setValue(props.value || '')
    props.onchange &&
      editorInstance.onKeyUp(() => {
        const value = editorInstance.getValue()
        props.onchange && props.onchange(value)
      })
    return () => editorInstance.dispose()
  },
  render: ({ element }) => {
    element.style.width = '500px'
    element.style.height = '500px'
    element.style.flexGrow = '1'
    return null
  },
})
