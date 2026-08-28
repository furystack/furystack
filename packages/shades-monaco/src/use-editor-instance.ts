import { ThemeProviderService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { editor } from 'monaco-editor'
import type { Injector } from '../../inject/src/injector.js'
import { registerShadesTheme } from './register-shades-theme.js'
import { useEditorValueTracking } from './use-editor-value-tracking.js'

export type UseEditorInstanceOptions = {
  /**
   * The HTML Element that should be used as the base DOM element for monaco `editor.create(...)`
   */
  element: HTMLElement
  /**
   * The injector instance to retrieve neccessary services, e.g.: ThemeProviderService
   */
  injector: Injector
  /**
   * Additional options that can be passed to the Monaco Editor's `editor.create(...)` method
   */
  options: editor.IStandaloneEditorConstructionOptions

  /**
   * The initial value
   */
  value?: string

  /**
   * A callback that will be fired once the value has been changed
   */
  onValueChange?: (newValue: string) => void

  /**
   * Callback that will be called when the markers (errors, warnings, etc...) changes
   *
   * @param newMarkers A list of new markers
   */
  onMarkersChange?: (newMarkers: editor.IMarker[]) => void
}

/**
 * Utility method to manage Monaco Editor Instance
 *
 * @param param0 The Options to use for the editor instance
 * @returns The created Editor Instance
 */
export const useEditorInstance = ({
  element,
  injector,
  options,
  value,
  onValueChange,
  onMarkersChange,
}: UseEditorInstanceOptions) => {
  const themeName = registerShadesTheme({ injector })

  const editorInstance = editor.create(element, {
    theme: themeName,
    value,
    ...options,
  })

  const themeProvider = injector.get(ThemeProviderService)
  const themeSub = themeProvider.subscribe('themeChanged', () => {
    const updatedName = registerShadesTheme({ injector })
    editor.setTheme(updatedName)
  })

  const valueTracker = useEditorValueTracking({ editor: editorInstance })
  if (onValueChange) {
    valueTracker.valueObservable.subscribe(onValueChange)
  }

  const markerObserver = new ObservableValue<editor.IMarker[]>([], {
    compare: (a, b) => JSON.stringify(a) !== JSON.stringify(b),
  })

  editorInstance.onDidChangeModelDecorations(() => {
    const model = editorInstance?.getModel()
    const newMarkers = editor.getModelMarkers({ resource: model?.uri })
    markerObserver.setValue(newMarkers)
  })

  const markerSubscription = markerObserver.subscribe((newMarkers) => {
    onMarkersChange?.(newMarkers)
  })

  return {
    editorInstance,
    markerObserver,
    [Symbol.dispose]: () => {
      themeSub[Symbol.dispose]()
      editorInstance.dispose()
      markerSubscription[Symbol.dispose]()
      markerObserver[Symbol.dispose]()
      valueTracker[Symbol.dispose]()
    },
  }
}
