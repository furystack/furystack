import { Shade } from '@furystack/shades'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/editor/editor.main'

import './worker-config'

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
