import type { ChildrenList, ShadeComponent } from './models/index.js'
import { isShadeComponent } from './models/shade-component.js'
import { SVG_NS, isSvgTag } from './svg.js'
import { createVNode } from './vnode.js'

// ---------------------------------------------------------------------------
// Render-mode toggle
// ---------------------------------------------------------------------------

let renderMode = false

/**
 * When true, the JSX factory produces VNode descriptors instead of real DOM elements.
 * Set to true by `_performUpdate` before calling `render()`, then back to false after.
 */
export const setRenderMode = (mode: boolean): void => {
  renderMode = mode
}

// ---------------------------------------------------------------------------
// Real-DOM helpers (used outside render mode)
// ---------------------------------------------------------------------------

/**
 * Appends `children` to `el`. Strings/numbers are wrapped in text nodes;
 * nested arrays are flattened recursively. Used outside render mode (real
 * DOM); inside render mode the JSX factory builds VNodes instead.
 */
export const appendChild = (el: Element | DocumentFragment, children: ChildrenList) => {
  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(child))
    } else {
      if (child instanceof Element || child instanceof DocumentFragment) {
        el.appendChild(child)
      } else if (child instanceof Array) {
        appendChild(el, child)
      }
    }
  }
}

export const hasStyle = (props: unknown): props is { style: Partial<CSSStyleDeclaration> } => {
  return (
    !!props && typeof props === 'object' && typeof (props as { style: Partial<CSSStyleDeclaration> }).style === 'object'
  )
}

/** Copies `props.style` (when present) onto `el.style`. No-op for non-styled props. */
export const attachStyles = (el: HTMLElement, props: unknown) => {
  if (hasStyle(props))
    for (const key in props.style) {
      if (Object.prototype.hasOwnProperty.call(props.style, key)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        el.style[key] = props.style[key]
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
 * Assigns `props` onto `el` as element properties (not attributes). `style`
 * is forwarded to {@link attachStyles}; `data-*` / `aria-*` are forwarded to
 * {@link attachDataAttributes}.
 */
export const attachProps = <TProps extends object>(el: HTMLElement, props: TProps) => {
  if (!props) {
    return
  }
  attachStyles(el, props)

  if (hasStyle(props)) {
    const { style, ...rest } = props
    Object.assign(el, rest)
  } else {
    Object.assign(el, props)
  }
  attachDataAttributes(el, props)
}

/**
 * SVG counterpart of {@link attachProps}. SVG attributes are XML-based and
 * must be set via `setAttribute` rather than property assignment. Event
 * handlers (`on*`) and `style` are still set as properties.
 */
export const attachSvgProps = <TProps extends object>(el: Element, props: TProps) => {
  if (!props) {
    return
  }
  for (const [key, value] of Object.entries(props)) {
    if (key === 'style' && typeof value === 'object' && value !== null) {
      for (const [sk, sv] of Object.entries(value as Record<string, string>)) {
        ;((el as HTMLElement).style as unknown as Record<string, string>)[sk] = sv
      }
    } else if (key === 'className') {
      el.setAttribute('class', String(value))
    } else if (key.startsWith('on') && typeof value === 'function') {
      ;(el as unknown as Record<string, unknown>)[key] = value
    } else if (value !== null && value !== undefined && value !== false) {
      el.setAttribute(key, String(value))
    }
  }
}

type CreateComponentArgs<TProps> = [
  elementType: string | ShadeComponent<TProps>,
  props: TProps,
  ...children: ChildrenList,
]

/**
 * JSX factory backing both intrinsic elements (`<div>`, `<svg>`, …) and
 * Shade components (`<MyShade>`). Configured as `jsxFactory` in tsconfig.
 * Outside render mode this returns real DOM nodes; the render-mode wrapper
 * {@link createComponent} swaps in VNode descriptors.
 */
export const createComponentInner = <TProps extends object>(
  ...[elementType, props, ...children]: CreateComponentArgs<TProps>
) => {
  if (typeof elementType === 'string') {
    const isSvg = isSvgTag(elementType)
    const el = isSvg ? document.createElementNS(SVG_NS, elementType) : document.createElement(elementType)

    if (isSvg) {
      attachSvgProps(el, props)
    } else {
      attachProps(el as HTMLElement, props)
    }

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
  // Strip __self / __source dev-mode metadata that JSX transpilers (e.g. Vite 8+)
  // inject into the props object. These are not real component props and would
  // pollute shallow-equality checks, prop forwarding, and component rendering.
  const rawProps = args[1]
  if (rawProps && typeof rawProps === 'object' && ('__self' in rawProps || '__source' in rawProps)) {
    const { __self, __source, ...cleanProps } = rawProps as Record<string, unknown>
    args[1] = cleanProps as (typeof args)[1]
  }

  // In render mode, produce VNode descriptors instead of real DOM elements
  if (renderMode) {
    const [type, props, ...children] = args
    // When jsxFragmentFactory === jsxFactory (both "createComponent"), the compiler
    // passes createComponent itself as the first arg for fragments: createComponent(createComponent, null, ...)
    if (type === null || (type as unknown) === createComponent) {
      return createVNode(null, null, ...children) as unknown as ReturnType<typeof createComponentInner>
    }
    return createVNode(
      type as string | ((...a: unknown[]) => unknown),
      props as Record<string, unknown> | null,
      ...children,
    ) as unknown as ReturnType<typeof createComponentInner>
  }

  if (args[0] === null) {
    return createFragmentInner(...args)
  }
  return createComponentInner(...args)
}
