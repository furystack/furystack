import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { defaultDarkTheme, ThemeProviderService } from '@furystack/shades-common-components'
import { usingAsync } from '@furystack/utils'
import { editor, Uri } from 'monaco-editor'
import 'monaco-editor/features/register.all'
import type { JSONSchema } from 'monaco-editor/languages/features/json/register.js'
import 'monaco-editor/languages/register.all'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MonacoEditor, type MonacoEditorProps, type SchemaOptions } from './monaco-editor.js'

vi.hoisted(() => {
  global.document.queryCommandSupported = () => false
  global.window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    removeEventListener: vi.fn(),
  })
})

describe('MonacoEditor', { timeout: 30 * 1000 }, () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render default empty component when no data', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      injector.get(ThemeProviderService).setAssignedTheme(defaultDarkTheme)

      const exampleValue = crypto.randomUUID()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MonacoEditor options={{}} value={exampleValue} />,
      })

      await flushUpdates()

      const editorInstance = document.querySelector('monaco-editor')
      expect(editorInstance).not.toBeNull()
      await expect
        .poll(
          () => {
            return editorInstance?.textContent
          },
          { timeout: 20 * 1000 },
        )
        .toContain(exampleValue)
    })
  })

  it('Should use a JSON Schema', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      injector.get(ThemeProviderService).setAssignedTheme(defaultDarkTheme)

      const exampleValue = JSON.stringify(
        {
          username: 'Fury Frank',
          age: 12,
          isAdmin: true,
        },
        undefined,
        2,
      )

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

      const modelUri = 'furystack://my-custom-schema.json'

      const schema = {
        uri: modelUri,
        diagnosticOptions: {
          schemaValidation: 'error',
        },
        jsonSchema: userSchema,
      } satisfies SchemaOptions

      const onMarkersChangeFn = vi.fn()
      const onValueChangeFn = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <MonacoEditor
            options={{
              language: 'json',
            }}
            value={''}
            onMarkersChange={onMarkersChangeFn}
            onValueChange={onValueChangeFn}
            schema={schema}
          />
        ),
      })

      await flushUpdates()

      const editorInstance = document.querySelector('monaco-editor') as HTMLTextAreaElement &
        JSX.Element<MonacoEditorProps>

      editorInstance.props.value = exampleValue
      editorInstance.updateComponent()

      await flushUpdates()

      await expect.poll(() => onValueChangeFn, { timeout: 10 * 1000 }).toHaveBeenCalledOnce()
      expect(onValueChangeFn).toHaveBeenCalledExactlyOnceWith(exampleValue)

      const modelUriInstance = Uri.parse(modelUri)
      const existingModel = editor.getModel(modelUriInstance)

      expect(existingModel).toBeDefined()
      expect(existingModel!.uri).toStrictEqual(modelUriInstance)
    })
  })
})
