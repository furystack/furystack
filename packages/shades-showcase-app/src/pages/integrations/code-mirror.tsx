import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment } from '@codemirror/state'
import { tags } from '@lezer/highlight'

import { createComponent, Shade } from '@furystack/shades'
import {
  cssVariableTheme,
  getThemeMode,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  ThemeProviderService,
  type Theme,
} from '@furystack/shades-common-components'
import type { DeepPartial } from '@furystack/utils'
import { basicSetup, EditorView } from 'codemirror'

export const CodeMirrorPage = Shade({
  customElementName: 'code-mirror-page',
  render: ({ useRef, useDisposable, injector }) => {
    const container = useRef<HTMLDivElement>('container')

    queueMicrotask(() => {
      if (container.current) {
        useDisposable('codeMirrorComponent', () => {
          const themeCompartment = new Compartment()
          const highlighterCompartment = new Compartment()

          const instance = new EditorView({
            doc: '// IMMA JAVASCRIPT \rconst alma = "asd123";\nconst korte="xyz321"\nif (alma !== korte){\n  return false\n}',
            parent: container.current as HTMLDivElement,
            extensions: [
              basicSetup,
              javascript({ typescript: true, jsx: true }),
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
      <PageContainer>
        <PageHeader
          icon={<Icon icon={icons.code} />}
          title="CodeMirror Editor"
          description={
            <>
              <a href="https://codemirror.net/" target="_blank" style={{ color: cssVariableTheme.text.primary }}>
                CodeMirror
              </a>
              &nbsp; is a lightweight and extensible editor code editor that can be integrated in the web
            </>
          }
        />
        <Paper
          elevation={3}
          style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0', padding: '16px' }}
        >
          <div ref={container} />
        </Paper>
      </PageContainer>
    )
  },
})
