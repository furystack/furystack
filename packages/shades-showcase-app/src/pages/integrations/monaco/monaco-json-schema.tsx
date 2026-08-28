import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '@furystack/shades-monaco'

import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'

const myCustomJsonSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', description: 'The unique handle for the user account.' },
    age: { type: 'integer', minimum: 18, description: 'User must be at least 18 years old.' },
    isAdmin: { type: 'boolean', default: false },
  },
  required: ['username', 'age'],
}

const initialDoc = JSON.stringify({ username: 'fury_fred', age: 8, isAdmin: false }, undefined, 2)

export const MonacoJsonSchema = Shade({
  customElementName: 'monaco-json-schema-example',
  style: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ useState }) => {
    const [value, setValue] = useState('JSValue', initialDoc)

    useState('JsonSchema', myCustomJsonSchema)

    return (
      <MonacoEditor
        style={{ flex: '1', minHeight: '0' }}
        options={{
          language: 'json',
          automaticLayout: true,
        }}
        value={value}
        onValueChange={(v) => setValue(v as string)}
      />
    )
  },
})
