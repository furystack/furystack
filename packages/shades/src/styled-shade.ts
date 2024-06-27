import type { ChildrenList } from './models/children-list.js'
import { hasStyle } from './shade-component.js'

/**
 * Creates a shortcut for a specific custom Shade element with additional styles
 * @param element The element instance
 * @param styles The additional styles to add
 * @returns The updated element
 */
export const styledShade = <T extends (props: any, children?: ChildrenList) => JSX.Element>(
  element: T,
  styles: Partial<CSSStyleDeclaration>,
) => {
  return ((props: any, childrenList?: ChildrenList) => {
    const mergedProps = hasStyle(props)
      ? {
          ...props,
          style: {
            ...props.style,
            ...styles,
          },
        }
      : {
          ...props,
          style: styles,
        }
    return element(mergedProps, childrenList)
  }) as T
}
