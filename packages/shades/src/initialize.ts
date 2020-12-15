import { Injector } from '@furystack/inject'

export interface InitializeOptions {
  rootElement: HTMLElement
  jsxElement: JSX.Element
  injector: Injector
}
export const initializeShadeRoot = (options: InitializeOptions) => {
  options.jsxElement.injector = options.injector
  options.rootElement.appendChild(options.jsxElement)
}
