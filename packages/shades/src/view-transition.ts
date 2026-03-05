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
 * Returns the `updateCallbackDone` promise when a transition is started, allowing callers
 * that need to wait for the DOM update (e.g. to run lifecycle hooks) to `await` the result.
 * Returns `undefined` when no transition is used (the update runs synchronously).
 *
 * @param config - The view transition configuration (boolean or object with types)
 * @param update - The synchronous DOM update callback
 * @returns A promise that resolves after the update callback completes inside the transition, or `undefined`
 */
export const maybeViewTransition = (
  config: boolean | ViewTransitionConfig | undefined,
  update: () => void,
): Promise<void> | undefined => {
  if (config && document.startViewTransition) {
    const types = typeof config === 'object' ? config.types : undefined
    const transition = document.startViewTransition({ update, ...(types?.length ? { types } : {}) })
    return transition.updateCallbackDone
  } else {
    update()
  }
}
