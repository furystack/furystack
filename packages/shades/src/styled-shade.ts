import type { ChildrenList } from './models/children-list.js'

type StyledProps = {
  style?: Partial<CSSStyleDeclaration>
}

/**
 * Wraps a Shade factory with a baked-in `style` overlay. Baked-in `styles`
 * win over caller-supplied `style` props (the wrapper merges last). Use to
 * specialise an existing Shade (e.g. theme variants) without registering
 * a new custom element.
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
      },
      childrenList,
    )
  }
}
