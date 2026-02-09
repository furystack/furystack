import type { Injector } from '@furystack/inject'

/**
 * Options for bootstrapping a Shades application.
 */
export interface InitializeOptions {
  /** The DOM element that will host the application */
  rootElement: HTMLElement
  /** The root JSX element to render */
  jsxElement: JSX.Element
  /** The root injector instance for dependency injection */
  injector: Injector
}

/**
 * Bootstraps a Shades application by attaching the root JSX element to a DOM node
 * and wiring up the dependency injection context.
 * @param options The initialization options
 */
export const initializeShadeRoot = (options: InitializeOptions) => {
  options.jsxElement.injector = options.injector
  options.rootElement.appendChild(options.jsxElement)
}
