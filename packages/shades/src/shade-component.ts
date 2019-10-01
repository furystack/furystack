import { Injector } from '@furystack/inject'
import { DomObserverService } from './dom-observer-service'
import { ChildrenList } from './models/children-list'
import { ShadeComponent, isShadeComponent } from './models/shade-component'

/**
 * Appends a list of items to a HTML element
 * @param el the root element
 * @param children array of items to append
 */
export const appendChild = (el: HTMLElement, children: ChildrenList) => {
  for (const child of children) {
    if (typeof child === 'string') {
      el.innerText += child
    } else {
      if (child instanceof HTMLElement) {
        el.appendChild(child)
      } else if (child instanceof Array) {
        appendChild(el, child)
      }
    }
  }
}

/**
 * static injector instance for Shade
 */
export const shadeInjector = new Injector()

/**
 * Factory method that creates a component. This should be configured as a default JSX Factory in tsconfig.
 * @param elementType The type of the element (component or stateless component factory method)
 * @param props The props for the component
 * @param children additional rest parameters will be parsed as children objects
 */
export const createComponent = <TProps>(
  elementType: string | ShadeComponent<TProps>,
  props: TProps,
  ...children: ChildrenList
) => {
  shadeInjector.getInstance(DomObserverService).EnsureStarted()

  let el!: HTMLElement | JSX.Element
  if (typeof elementType === 'string') {
    el = document.createElement(elementType)
    Object.assign(el, props)

    if (props && (props as any).style) {
      const style = (props as any).style as CSSStyleDeclaration
      for (const styleName of Object.keys(style) as Array<keyof CSSStyleDeclaration>) {
        el.style[styleName as any] = style[styleName]
      }
    }
    if (children) {
      appendChild(el, children)
    }
  } else if (isShadeComponent(elementType)) {
    el = (elementType as ShadeComponent<TProps>)(props, children)
  }
  return el
}
