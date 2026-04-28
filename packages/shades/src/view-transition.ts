/**
 * Configuration for the View Transition API integration.
 * When provided as an object, allows specifying transition types for CSS targeting
 * via the `:active-view-transition-type()` pseudo-class.
 */
export type ViewTransitionConfig = {
  types?: string[]
}

/**
 * Runs `update` inside `document.startViewTransition()` when the API is
 * available and `config` is truthy; otherwise calls `update` synchronously.
 *
 * The returned promise (when a transition starts) resolves once the update
 * callback completes inside the transition — callers that need to chain
 * lifecycle work after the DOM swap can `await` it. Returns `undefined`
 * when no transition is used.
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
 * Decouples a component's "displayed" value from its source. When `value`
 * changes and `shouldTransition(prev, next)` returns true, the swap is
 * routed through {@link maybeViewTransition}; otherwise the displayed
 * value updates synchronously. `shouldTransition` defaults to always-true.
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
