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
    const [value, setValue] = useState('JSValue', '')

    return (
      <MonacoEditor
        style={{ flex: '1', minHeight: '0' }}
        options={{
          language: 'typescript',
          automaticLayout: true,
        }}
        value={value}
        onchange={(v) => setValue(v as string)}
      />
    )
  },
})
