import { editor } from 'monaco-editor'

import { ThemeProviderService } from '@furystack/shades-common-components'
import type { Injector } from '@furystack/inject'

import { attachEditorSide } from './attach-editor-side.js'
import { provideShadesTheme } from './provide-shades-theme.js'
import type { AttachEditorSideOptions } from './attach-editor-side.js'

export type DiffEditorSideCallbacks = Omit<AttachEditorSideOptions, 'codeEditor'>

export type UseDiffEditorInstanceOptions = {
  /**
   * The HTML Element that should be used as the base DOM element for monaco `editor.createDiffEditor(...)`
   */
  element: HTMLElement
  /**
   * The injector instance to retrieve neccessary services, e.g.: ThemeProviderService
   */
  injector: Injector
  /**
   * Additional options that can be passed to the Monaco Editor's `editor.createDiffEditor(...)` method
   */
  options: editor.IStandaloneDiffEditorConstructionOptions
  /**
   * Callbacks for the original (left) editor pane
   */
  original?: DiffEditorSideCallbacks
  /**
   * Callbacks for the modified (right) editor pane
   */
  modified?: DiffEditorSideCallbacks
}

export type DiffEditorInstance = {
  diffEditorInstance: editor.IStandaloneDiffEditor
  [Symbol.dispose]: () => void
}

/**
 * Creates a Monaco diff editor and wires theme, value, marker, and update
 * listeners on both the original and modified panes.
 */
export const useDiffEditorInstance = ({
  element,
  injector,
  options,
  original,
  modified,
}: UseDiffEditorInstanceOptions): DiffEditorInstance => {
  const themeName = provideShadesTheme({ injector })

  const diffEditorInstance = editor.createDiffEditor(element, {
    theme: themeName,
    ...options,
  })

  const themeProvider = injector.get(ThemeProviderService)
  const themeSub = themeProvider.subscribe('themeChanged', () => {
    const updatedName = provideShadesTheme({ injector })
    editor.setTheme(updatedName)
  })

  const originalSide = attachEditorSide({
    codeEditor: diffEditorInstance.getOriginalEditor(),
    ...original,
  })

  const modifiedSide = attachEditorSide({
    codeEditor: diffEditorInstance.getModifiedEditor(),
    ...modified,
  })

  return {
    diffEditorInstance,
    [Symbol.dispose]: () => {
      themeSub[Symbol.dispose]()
      originalSide[Symbol.dispose]()
      modifiedSide[Symbol.dispose]()
      diffEditorInstance.dispose()
    },
  }
}
