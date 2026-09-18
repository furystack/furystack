import { createComponent, Shade } from '@furystack/shades'
import { getThemeMode, Paper, ThemeProviderService, type Theme } from '@furystack/shades-common-components'

import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment } from '@codemirror/state'
import type { DeepPartial } from '@furystack/utils'
import { tags } from '@lezer/highlight'
import { basicSetup, EditorView } from 'codemirror'
import { jsonSchema } from 'codemirror-json-schema'

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

export const CodeMirrorJsonSchemaExample = Shade({
  customElementName: 'code-mirror-json-schema-example',
  render: ({ useRef, useDisposable, injector }) => {
    const container = useRef<HTMLDivElement>('container')

    queueMicrotask(() => {
      if (container.current) {
        useDisposable('codeMirrorComponent', () => {
          const themeCompartment = new Compartment()
          const highlighterCompartment = new Compartment()

          const instance = new EditorView({
            doc: initialDoc,
            parent: container.current as HTMLDivElement,
            extensions: [
              basicSetup,
              json(),
              // eslint-disable-next-line
              jsonSchema(myCustomJsonSchema),
              themeCompartment.of(EditorView.theme({})),
              highlighterCompartment.of(syntaxHighlighting(HighlightStyle.define([]))),
            ],
          })

          const updateCodeMirrorTheme = (newTheme: DeepPartial<Theme>) => {
            const themeMode = getThemeMode(newTheme)
            const updatedTheme = EditorView.theme(
              {
                '&': {
                  color: newTheme.text?.secondary || '',
                  background: newTheme.background?.default || '',
                },
              },
              { dark: themeMode === 'dark' },
            )

            const updatedHighlighter = HighlightStyle.define(
              [
                { tag: tags.keyword, color: newTheme.palette?.primary?.main },
                { tag: tags.variableName, color: newTheme?.palette?.secondary?.main },
                { tag: tags.separator, color: newTheme.text?.primary },
                { tag: tags.operator, color: newTheme.text?.primary },
                { tag: tags.compareOperator, color: newTheme.text?.primary },
                { tag: tags.string, color: newTheme?.palette?.secondary?.light },
                { tag: tags.number, color: newTheme?.palette?.secondary?.light },
              ],
              {
                themeType: themeMode,
              },
            )

            instance.dispatch({
              effects: [
                themeCompartment.reconfigure(updatedTheme),
                highlighterCompartment.reconfigure(syntaxHighlighting(updatedHighlighter)),
              ],
            })
          }

          const themeProviderService = injector.get(ThemeProviderService)

          const themeObservable = themeProviderService.subscribe('themeChanged', updateCodeMirrorTheme)

          updateCodeMirrorTheme(themeProviderService.theme)

          return {
            [Symbol.dispose]: () => {
              // clean up
              instance.destroy()
              themeObservable[Symbol.dispose]()
            },
          }
        })
      }
    })

    return (
      <Paper
        elevation={3}
        style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0', padding: '16px' }}
      >
        <div ref={container} />
      </Paper>
    )
  },
})
