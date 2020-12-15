import { ChildrenList, ShadeComponent, isShadeComponent } from './models'

/**
 * Appends a list of items to a HTML element
 *
 * @param el the root element
 * @param children array of items to append
 */
export const appendChild = (el: HTMLElement, children: ChildrenList) => {
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      if (child instanceof HTMLElement) {
        el.appendChild(child)
      } else if (child instanceof Array) {
        appendChild(el, child)
      }
    }
  }
}

export const hasStyle = (props: any): props is { style: Partial<CSSStyleDeclaration> } => {
  return props?.style !== undefined
}

/**
 * @param el The Target HTML Element
 * @param props The Properties to fetch The Styles Object
 */
export const attachStyles = (el: HTMLElement, props: any) => {
  if (hasStyle(props))
    for (const key in props.style) {
      if (Object.prototype.hasOwnProperty.call(props.style, key)) {
        ;(el.style as any)[key] = props.style[key]
      }
    }
}

/**
 * Factory method that creates a component. This should be configured as a default JSX Factory in tsconfig.
 *
 * @param elementType The type of the element (component or stateless component factory method)
 * @param props The props for the component
 * @param children additional rest parameters will be parsed as children objects
 * @returns the created JSX element
 */
export const createComponent = <TProps>(
  elementType: string | ShadeComponent<TProps>,
  props: TProps,
  ...children: ChildrenList
) => {
  if (typeof elementType === 'string') {
    const el = document.createElement(elementType)
    Object.assign(el, props)

    if (props && (props as any).style) {
      attachStyles(el, props)
    }
    if (children) {
      appendChild(el, children)
    }
    return el
  } else if (isShadeComponent(elementType)) {
    const el = (elementType as ShadeComponent<TProps>)(props, children)
    attachStyles(el, props)
    return el
  }
}
