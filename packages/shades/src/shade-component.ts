import { ObservableValue } from '@furystack/utils'
import type { ChildrenList, ShadeComponent } from './models/index.js'
import { isShadeComponent } from './models/shade-component.js'
import {
  createReactiveAttribute,
  createReactiveProperty,
  createReactiveStyle,
  createReactiveTextNode,
} from './reactive-binding.js'
import { setElementProps } from './reconcile.js'

/**
 * Appends a list of items to a HTML element
 * @param el the root element
 * @param children array of items to append
 */
export const appendChild = (el: HTMLElement | DocumentFragment, children: ChildrenList) => {
  for (const child of children) {
    if (child instanceof ObservableValue) {
      el.appendChild(createReactiveTextNode(child))
    } else if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)))
    } else {
      if (child instanceof HTMLElement || child instanceof DocumentFragment) {
        el.appendChild(child)
      } else if (child instanceof Array) {
        appendChild(el, child)
      }
    }
  }
}

export const hasStyle = (props: unknown): props is { style: Partial<CSSStyleDeclaration> } => {
  const styleValue = (props as { style?: unknown })?.style
  return (
    !!props &&
    typeof props === 'object' &&
    typeof styleValue === 'object' &&
    styleValue !== null &&
    !(styleValue instanceof ObservableValue)
  )
}

/**
 * @param el The Target HTML Element
 * @param props The Properties to fetch The Styles Object
 */
export const attachStyles = (el: HTMLElement, props: unknown) => {
  if (hasStyle(props))
    for (const key in props.style) {
      if (Object.prototype.hasOwnProperty.call(props.style, key)) {
        const value = (props.style as Record<string, unknown>)[key]
        if (value instanceof ObservableValue) {
          createReactiveStyle(el, key, value as ObservableValue<unknown>)
        } else {
          ;(el.style as unknown as Record<string, unknown>)[key] = value
        }
      }
    }
}

export const attachDataAttributes = <TProps extends object>(el: HTMLElement, props: TProps) => {
  if (props) {
    Object.entries(props)
      .filter(([key]) => key.startsWith('data-') || key.startsWith('aria-'))
      .forEach(([key, value]) => el.setAttribute(key, (value as string) || ''))
  }
}

/**
 * Attaches properties to an HTML element
 * @param el The Target HTML Element
 * @param props The Props to attach
 */
export const attachProps = <TProps extends object>(el: HTMLElement, props: TProps) => {
  if (!props) {
    return
  }

  const nonReactiveProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value instanceof ObservableValue) {
      if (key === 'style') {
        continue
      }
      if (key.startsWith('data-') || key.startsWith('aria-')) {
        createReactiveAttribute(el, key, value as ObservableValue<unknown>)
      } else {
        createReactiveProperty(el, key, value as ObservableValue<unknown>)
      }
    } else {
      nonReactiveProps[key] = value
    }
  }

  setElementProps(el, nonReactiveProps)

  attachStyles(el, nonReactiveProps)

  if (hasStyle(nonReactiveProps)) {
    const { style, ...rest } = nonReactiveProps
    Object.assign(el, rest)
  } else {
    Object.assign(el, nonReactiveProps)
  }
  attachDataAttributes(el, nonReactiveProps as TProps)
}

type CreateComponentArgs<TProps> = [
  elementType: string | ShadeComponent<TProps>,
  props: TProps,
  ...children: ChildrenList,
]

/**
 * Factory method that creates a component. This should be configured as a default JSX Factory in tsconfig.
 * @returns the created JSX element
 */
export const createComponentInner = <TProps extends object>(
  ...[elementType, props, ...children]: CreateComponentArgs<TProps>
) => {
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

export const createComponent = <TProps extends object>(...args: CreateComponentArgs<TProps> | CreateFragmentArgs) => {
  if (args[0] === null) {
    return createFragmentInner(...args)
  }
  return createComponentInner(...args)
}
