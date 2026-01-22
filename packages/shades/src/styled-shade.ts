import type { ChildrenList } from './models/children-list.js'

/**
 * Props constraint for styled components - must have an optional style property
 */
type StyledProps = {
  style?: Partial<CSSStyleDeclaration>
}

/**
 * Creates a shortcut for a specific custom Shade element with additional styles
 * @param element The element instance
 * @param styles The additional styles to add
 * @returns The updated element
 */
export const styledShade = <TProps extends StyledProps>(
  element: (props: TProps, children?: ChildrenList) => JSX.Element,
  styles: Partial<CSSStyleDeclaration>,
): ((props: TProps, children?: ChildrenList) => JSX.Element) => {
  return (props: TProps, childrenList?: ChildrenList): JSX.Element => {
    return element(
      {
        ...props,
        style: {
          ...props.style,
          ...styles,
        },
      } as TProps,
      childrenList,
    )
  }
}
