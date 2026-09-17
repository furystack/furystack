import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { defaultDarkTheme, ThemeProviderService } from '@furystack/shades-common-components'
import { usingAsync } from '@furystack/utils'
import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/register.all'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MonacoEditor } from './monaco-editor.js'

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

      const editor = document.querySelector('monaco-editor')
      expect(editor).not.toBeNull()
      await expect
        .poll(
          () => {
            return editor?.textContent
          },
          { timeout: 20 * 1000 },
        )
        .toContain(exampleValue)
    })
  })
})
