import type { ChildrenList, ShadeComponent } from './models'
import { isShadeComponent } from './models'

/**
 * Appends a list of items to a HTML element
 *
 * @param el the root element
 * @param children array of items to append
 */
export const appendChild = (el: HTMLElement | DocumentFragment, children: ChildrenList) => {
  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(child))
    } else {
      if (child instanceof HTMLElement || child instanceof DocumentFragment) {
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

export const attachDataAttributes = (el: HTMLElement, props: any) => {
  props &&
    Object.entries(props)
      .filter(([key]) => key.startsWith('data-'))
      .forEach(([key, value]) => el.setAttribute(key, (value as string) || ''))
}

/**
 *
 * @param el The Target HTML Element
 * @param props The Props to attach
 */
export const attachProps = (el: HTMLElement, props: any) => {
  Object.assign(el, props)

  if (props && (props as any).style) {
    attachStyles(el, props)
  }
  attachDataAttributes(el, props)
}

type CreateComponentArgs<TProps> = [
  elementType: string | ShadeComponent<TProps>,
  props: TProps,
  ...children: ChildrenList,
]

// eslint-disable-next-line jsdoc/require-param
/**
 * Factory method that creates a component. This should be configured as a default JSX Factory in tsconfig.
 *
 * @returns the created JSX element
 */
export const createComponentInner = <TProps>(...[elementType, props, ...children]: CreateComponentArgs<TProps>) => {
  if (typeof elementType === 'string') {
    const el = document.createElement(elementType)

    attachProps(el, props)

    if (children) {
      appendChild(el, children)
    }
    return el
  } else if (isShadeComponent(elementType)) {
    const el = elementType(props, children)
    attachStyles(el, props)
    return el
  }
  return undefined
}

type CreateFragmentArgs = [props: null, ...children: ChildrenList]

export const createFragmentInner = (...[_props, ...children]: CreateFragmentArgs) => {
  const fragment = document.createDocumentFragment()
  appendChild(fragment, children)
  return fragment
}

export const createComponent = <TProps>(...args: CreateComponentArgs<TProps> | CreateFragmentArgs) => {
  if (args[0] === null) {
    return createFragmentInner(...args)
  }
  return createComponentInner(...args)
}
