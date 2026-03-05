/**
 * Configuration for the View Transition API integration.
 * When provided as an object, allows specifying transition types for CSS targeting
 * via the `:active-view-transition-type()` pseudo-class.
 */
export type ViewTransitionConfig = {
  types?: string[]
}

/**
 * Wraps a DOM update in `document.startViewTransition()` when the View Transition API
 * is available and `config` is truthy. Falls back to calling `update()` directly otherwise.
 *
 * @param config - The view transition configuration (boolean or object with types)
 * @param update - The synchronous DOM update callback
 */
export const maybeViewTransition = (config: boolean | ViewTransitionConfig | undefined, update: () => void): void => {
  if (config && document.startViewTransition) {
    const types = typeof config === 'object' ? config.types : undefined
    document.startViewTransition({ update, ...(types?.length ? { types } : {}) })
  } else {
    update()
  }
}
