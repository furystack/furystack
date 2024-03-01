import type { PartialElement } from './models/partial-element.js'
import { createComponent } from './shade-component.js'
import type { ChildrenList } from './models/children-list.js'

/**
 * Creates a shortcut for a specific custom Shade element with additional styles
 * @param element The element instance
 * @param styles The additional styles to add
 * @returns The updated element
 */
export const styledElement = <TElement extends keyof JSX.IntrinsicElements>(
  element: TElement,
  styles: Partial<CSSStyleDeclaration>,
): ((props: PartialElement<JSX.IntrinsicElements[TElement]>, childrenList: ChildrenList) => JSX.Element) => {
  return (props: any, childrenList: ChildrenList) => {
    const mergedProps = {
      ...props,
      style: {
        ...(props?.style || {}),
        ...styles,
      },
    }
    return createComponent(element, mergedProps, ...childrenList) as JSX.Element
  }
}
