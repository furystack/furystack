import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '@furystack/shades-monaco'

import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'

export const MonacoJs = Shade({
  customElementName: 'monaco-js-example',
  style: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ useState }) => {
    const [value, setValue] = useState(
      'JSValue',
      `
/**
 * JavaScript Example
 */
const array = [1,2,3]
array.toSorted() // <= This is a valid method

array.foo() // <== This should indicate an error: Property 'foo' does not exist on type 'number[]'.

array = 1 // <== This should also indicate an error: Cannot assign to 'array' because it is a constant.
`,
    )

    return (
      <MonacoEditor
        style={{ flex: '1', minHeight: '0' }}
        options={{
          language: 'typescript',
          automaticLayout: true,
        }}
        value={value}
        onValueChange={(v) => setValue(v as string)}
        onMarkersChange={console.log}
      />
    )
  },
})
