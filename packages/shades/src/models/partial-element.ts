import type { RefObject } from './render-options.js'

export type PartialElement<T> = (T extends { style?: CSSStyleDeclaration }
  ? Omit<Partial<T>, 'style'> & {
      style?: Partial<CSSStyleDeclaration>
    }
  : Partial<T>) & {
  /** Ref object to capture a reference to the underlying DOM element. */
  ref?: RefObject<Element>
}
