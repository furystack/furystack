import type { RefObject } from './render-options.js'

/**
 * Makes all properties of an HTML element type optional, with `style` narrowed
 * to `Partial<CSSStyleDeclaration>` and a `ref` prop for capturing DOM references.
 * Used as the props type for intrinsic JSX elements and component host element overrides.
 * @typeParam T - The base HTML element type
 */
export type PartialElement<T> = (T extends { style?: CSSStyleDeclaration }
  ? Omit<Partial<T>, 'style'> & {
      style?: Partial<CSSStyleDeclaration>
    }
  : Partial<T>) & {
  /** Ref object to capture a reference to the underlying DOM element. */
  ref?: RefObject<Element>
}
