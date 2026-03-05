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
    const types = typeof config === 'object' && config.types?.length ? config.types : undefined
    const transition = types ? document.startViewTransition({ update, types }) : document.startViewTransition(update)
    return transition.updateCallbackDone
  } else {
    update()
  }
}

/**
 * Keeps a "displayed" copy of `value` that is updated through a view transition
 * whenever the value changes and `shouldTransition` returns true.
 *
 * When the transition is skipped (config is falsy or `shouldTransition` returns false),
 * the displayed value is updated synchronously without an animation.
 *
 * @param useState - The component's `useState` hook
 * @param key - Unique state key for caching the displayed value
 * @param value - The latest source value (e.g. from `useObservable` or derived from props)
 * @param config - View transition configuration forwarded to `maybeViewTransition`
 * @param shouldTransition - Predicate that decides whether a value change warrants a transition.
 *   Defaults to `() => true` (always transition).
 * @returns The currently displayed value
 */
export const transitionedValue = <T>(
  useState: <S>(key: string, initialValue: S) => [S, (v: S) => void],
  key: string,
  value: T,
  config: boolean | ViewTransitionConfig | undefined,
  shouldTransition: (prev: T, next: T) => boolean = () => true,
): T => {
  const [displayed, setDisplayed] = useState(key, value)
  if (value !== displayed) {
    if (shouldTransition(displayed, value)) {
      void maybeViewTransition(config, () => setDisplayed(value))
    } else {
      setDisplayed(value)
    }
  }
  return displayed
}
