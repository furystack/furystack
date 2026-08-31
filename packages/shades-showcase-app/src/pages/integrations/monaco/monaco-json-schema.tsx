import { createComponent, Shade } from '@furystack/shades'
import { Button, Select } from '@furystack/shades-common-components'
import { MonacoEditor, type SchemaOptions } from '@furystack/shades-monaco'
import type { editor } from 'monaco-editor'

import 'monaco-editor/features/register.all'
import type { DiagnosticsOptions, JSONSchema } from 'monaco-editor/languages/features/json/register.js'
import 'monaco-editor/languages/register.all'
import { MonacoMarkers } from './monaco-markers.tsx'

const userSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', description: 'The unique handle for the user account.' },
    age: { type: 'integer', minimum: 18, description: 'User must be at least 18 years old.' },
    isAdmin: { type: 'boolean', default: false },
  },
  required: ['username', 'age'],
  additionalProperties: false,
} satisfies JSONSchema

const addressSchema = {
  type: 'object',
  properties: {
    country: { type: 'string', description: 'The Country Name' },
    city: { type: 'string', description: 'The City Name' },
    zip: { type: 'string', description: 'The ZIP Code' },
  },
  required: ['country', 'city', 'zip'],
  additionalProperties: false,
} satisfies JSONSchema

const initialDoc = JSON.stringify({ username: 'fury_fred', age: 8, isAdmin: false }, undefined, 2)

const schemas = [
  {
    uri: 'internal://shades-showcase-schema-registry/userSchema.json',
    jsonSchema: userSchema,
    diagnosticOptions: {
      validate: true,
      schemaValidation: 'error',
      comments: 'warning',
    },
  },
  {
    uri: 'internal://shades-showcase-schema-registry/addressSchema.json',
    jsonSchema: addressSchema,
    diagnosticOptions: {},
  },
] satisfies SchemaOptions[]

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
    const [markers, setMarkers] = useState('markers', [] as editor.IMarker[])

    const [schema, setSchema] = useState<{
      uri: string
      jsonSchema: JSONSchema
      diagnosticOptions: DiagnosticsOptions
    }>('schema', schemas[0])

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onclick={() => setValue(initialDoc)}>Reset</Button>
          <Select
            options={schemas.map((s) => ({ label: s.uri, value: s.uri }))}
            value={schema.uri}
            onValueChange={(newValue) => {
              setSchema(schemas.find((s) => s.uri === newValue) || schemas[0])
            }}
          />
          <div style={{ flex: '1' }} />
          <MonacoMarkers markers={markers} />
        </div>
        <MonacoEditor
          style={{ flex: '1', minHeight: '0' }}
          options={{
            language: 'json',
            automaticLayout: true,
          }}
          value={value}
          onValueChange={setValue}
          onMarkersChange={setMarkers}
          schema={schema}
        />
      </>
    )
  },
})
