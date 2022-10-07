import { Shade } from '@furystack/shades'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main'

import type { EditorLanguage } from 'monaco-editor/esm/metadata.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl(_moduleId: any, label: EditorLanguage) {
    if (label === 'json') {
      return '/js/monaco-editor/language/json/json.worker.js'
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return '/js/monaco-editor/language/css/css.worker.js'
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return '/js/monaco-editor/language/html/html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return '/js/monaco-editor/language/typescript/ts.worker.js'
    }
    return '/js/monaco-editor/editor/editor.worker.js'
  },
  getWorker: (moduleId: string, label: string) => {
    return new Worker((self as any).MonacoEnvironment.getWorkerUrl(moduleId, label), { type: 'module' })
  },
}

export interface MonacoEditorProps {
  options: monaco.editor.IStandaloneEditorConstructionOptions
  value?: string
  onchange?: (value: string) => void
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  constructed: ({ element, props }) => {
    const editorInstance = monaco.editor.create(element as HTMLElement, props.options)
    editorInstance.setValue(props.value || '')
    props.onchange &&
      editorInstance.onKeyUp(() => {
        const value = editorInstance.getValue()
        props.onchange && props.onchange(value)
      })
    return () => editorInstance.dispose()
  },
  render: ({ element }) => {
    element.style.display = 'block'
    element.style.height = 'calc(100% - 96px)'
    element.style.width = '100%'
    element.style.position = 'relative'
    return null
  },
})
