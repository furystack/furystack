import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { MonacoDiffEditor } from '@furystack/shades-monaco'
import type { editor } from 'monaco-editor'

import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'
import { MonacoMarkers } from './monaco-markers.tsx'

const originalJsValue = `const greet = (name: string) => {
  return 'Hello, ' + name
}

greet('world')
`

const modifiedJsValue = `const greet = (name: string) => {
  return \`Hello, \${name}!\`
}

greet('FuryStack')
`

export const MonacoDiff = Shade({
  customElementName: 'monaco-diff-example',
  style: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ useState }) => {
    const [originalValue, setOriginalValue] = useState('originalValue', originalJsValue)
    const [modifiedValue, setModifiedValue] = useState('modifiedValue', modifiedJsValue)
    const [markers, setMarkers] = useState<editor.IMarker[] | null>('markers', null)
    const [isUpdating, setIsUpdating] = useState('isUpdating', false)

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            onclick={() => {
              setOriginalValue(originalJsValue)
              setModifiedValue(modifiedJsValue)
            }}
          >
            Reset
          </Button>
          <div style={{ flex: '1' }} />
          <MonacoMarkers markers={markers} isUpdating={isUpdating} />
        </div>
        <MonacoDiffEditor
          style={{ flex: '1', minHeight: '0' }}
          options={{
            automaticLayout: true,
          }}
          originalOptions={{
            value: originalValue,
            language: 'typescript',
            onValueChange: setOriginalValue,
          }}
          modifiedOptions={{
            value: modifiedValue,
            language: 'typescript',
            onValueChange: setModifiedValue,
            onMarkersChange: setMarkers,
            onStartUpdate: () => setIsUpdating(true),
            onEndUpdate: () => setIsUpdating(false),
          }}
        />
      </>
    )
  },
})
