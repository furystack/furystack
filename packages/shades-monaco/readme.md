# @furystack/shades-monaco

Monaco Editor components for Furystack Shades

## Installation

```bash
npm install @furystack/shades-monaco
# or
yarn add @furystack/shades-monaco
```

## Usage Example

```tsx
import { MonacoEditor } from '@furystack/shades-monaco'
import type { editor } from 'monaco-editor'

import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'

export const MyMonacoContainerComponent = Shade({
  customElementName: 'my-monaco-container-component',
  render: ({ useState }) => {
    const [value, setValue] = useState('value', '')

    return (
      <MonacoEditor
        options={{
          language: 'typescript',
          automaticLayout: true,
        }}
        value={value}
        onValueChange={(v) => {
          setValue(v)
        }}
      />
    )
  },
})
```
