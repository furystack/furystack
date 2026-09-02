import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { MonacoEditor } from '@furystack/shades-monaco'
import type { editor } from 'monaco-editor'

import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'
import { MonacoMarkers } from './monaco-markers.tsx'

const defaultJsValue = `
/**
 * JavaScript Example
 */
const array = [1,2,3]
array.toSorted() // <= This is a valid method

array.foo() // <== This should indicate an error: Property 'foo' does not exist on type 'number[]'.

array = 1 // <== This should also indicate an error: Cannot assign to 'array' because it is a constant.
`

export const MonacoJs = Shade({
  customElementName: 'monaco-js-example',
  style: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ useState }) => {
    const [value, setValue] = useState('jsValue', defaultJsValue)

    const [markers, setMarkers] = useState<editor.IMarker[] | null>('markers', null)

    const [isUpdating, setIsUpdating] = useState('isUpdating', false)

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            onclick={() => {
              setValue(defaultJsValue)
            }}
          >
            Reset
          </Button>
          <div style={{ flex: '1' }} />

          <MonacoMarkers markers={markers} isUpdating={isUpdating} />
        </div>

        <MonacoEditor
          style={{ flex: '1', minHeight: '0' }}
          options={{
            language: 'typescript',
            automaticLayout: true,
          }}
          value={value}
          onValueChange={(v) => {
            setValue(v)
          }}
          onMarkersChange={setMarkers}
          onStartUpdate={() => setIsUpdating(true)}
          onEndUpdate={() => setIsUpdating(false)}
        />
      </>
    )
  },
})
