export type CSSProperties = Partial<CSSStyleDeclaration>

/**
 * Selector keys for pseudo-classes and nested selectors. The leading `&`
 * is replaced with the host selector at registration time
 * (e.g. `&:hover` → `my-element:hover`).
 */
export type SelectorKey = `&${string}`

/**
 * CSS object supporting nested selectors for component-level styling.
 *
 * Use this type for the `css` property in Shade components to define
 * styles that are injected as a stylesheet during component registration.
 *
 * @example
 * ```typescript
 * const styles: CSSObject = {
 *   padding: '16px',
 *   backgroundColor: 'white',
 *   '&:hover': {
 *     backgroundColor: '#f0f0f0'
 *   },
 *   '& .title': {
 *     fontWeight: 'bold'
 *   }
 * }
 * ```
 */
export type CSSObject = CSSProperties & {
  [K in SelectorKey]?: CSSProperties
}
