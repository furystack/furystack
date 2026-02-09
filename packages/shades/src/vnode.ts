/**
 * VNode-based reconciliation for Shades.
 *
 * Instead of creating real DOM elements during each render and then diffing them,
 * the JSX factory produces lightweight VNode descriptors. A reconciler diffs the
 * previous VNode tree against the new one and applies surgical DOM updates using
 * tracked `_el` references.
 */

import type { ChildrenList } from './models/children-list.js'
import type { RefObject } from './models/render-options.js'
import { SVG_NS, isSvgTag } from './svg.js'

// ---------------------------------------------------------------------------
// Brands & sentinels
// ---------------------------------------------------------------------------

const VNODE_BRAND = 'vnode' as const
const VTEXT_BRAND = 'vtext' as const

/**
 * Sentinel type used as VNode.type for JSX fragments (`<>...</>`).
 */
export const FRAGMENT: unique symbol = Symbol('fragment')

/**
 * Sentinel type for VNodes that wrap a pre-existing real DOM node.
 * Used when shadeChildren (created outside render mode) flow into a VNode render.
 */
export const EXISTING_NODE: unique symbol = Symbol('existing-node')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A lightweight descriptor for a DOM element or Shade component.
 */
export type VNode = {
  _brand: typeof VNODE_BRAND
  type: string | ((...args: unknown[]) => unknown) | typeof FRAGMENT | typeof EXISTING_NODE
  props: Record<string, unknown> | null
  children: VChild[]
  _el?: Node
}

/**
 * A lightweight descriptor for a DOM text node.
 */
export type VTextNode = {
  _brand: typeof VTEXT_BRAND
  text: string
  _el?: Text
}

/**
 * A single child in a VNode tree -- either an element/component or a text node.
 */
export type VChild = VNode | VTextNode

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export const isVNode = (v: unknown): v is VNode =>
  typeof v === 'object' && v !== null && (v as VNode)._brand === VNODE_BRAND

export const isVTextNode = (v: unknown): v is VTextNode =>
  typeof v === 'object' && v !== null && (v as VTextNode)._brand === VTEXT_BRAND

// ---------------------------------------------------------------------------
// VNode creation
// ---------------------------------------------------------------------------

/**
 * Recursively flattens raw JSX children into a flat VChild array.
 * - Strings and numbers become VTextNodes.
 * - Fragment VNodes are inlined (their children are spliced in).
 * - Nullish / boolean values are skipped.
 */
export const flattenVChildren = (raw: unknown[]): VChild[] => {
  const result: VChild[] = []
  for (const child of raw) {
    if (child === null || child === undefined || child === false || child === true) continue
    if (typeof child === 'string') {
      result.push({ _brand: VTEXT_BRAND, text: child })
    } else if (typeof child === 'number') {
      result.push({ _brand: VTEXT_BRAND, text: String(child) })
    } else if (Array.isArray(child)) {
      result.push(...flattenVChildren(child))
    } else if (isVNode(child)) {
      if (child.type === FRAGMENT) {
        result.push(...child.children)
      } else {
        result.push(child)
      }
    } else if (isVTextNode(child)) {
      result.push(child)
    } else if (child instanceof Node) {
      // Real DOM node from shadeChildren (created outside render mode).
      // Wrap it so the reconciler can track it.
      result.push({ _brand: VNODE_BRAND, type: EXISTING_NODE, props: null, children: [], _el: child })
    }
  }
  return result
}

/**
 * Creates a VNode descriptor. Used as the JSX factory during renders.
 *
 * For intrinsic elements (string type), the returned VNode includes DOM-shim
 * methods (`setAttribute`, `appendChild`, etc.) so that component code which
 * creates intermediate JSX and calls DOM methods on it continues to work.
 *
 * @param type Tag name, Shade factory function, or null (fragment)
 * @param props Element props / component props
 * @param rawChildren Varargs children (strings, VNodes, arrays, etc.)
 */
export const createVNode = (
  type: string | ((...args: unknown[]) => unknown) | null,
  props: Record<string, unknown> | null,
  ...rawChildren: unknown[]
): VNode => {
  const children = flattenVChildren(rawChildren)
  const vnode: VNode = {
    _brand: VNODE_BRAND,
    type: type === null ? FRAGMENT : type,
    props: props ? { ...props } : null,
    children,
  }

  // For intrinsic elements, add DOM-shim methods so that component render code
  // which does `const el = <div/>; el.setAttribute(...)` still works in VNode mode.
  if (typeof type === 'string') {
    const v = vnode as unknown as Record<string, unknown>
    v.setAttribute = (name: string, value: string) => {
      if (!vnode.props) vnode.props = {}
      vnode.props[name] = value
    }
    v.removeAttribute = (name: string) => {
      if (vnode.props) delete vnode.props[name]
    }
    v.getAttribute = (name: string) => {
      return (vnode.props?.[name] as string) ?? null
    }
    v.hasAttribute = (name: string) => {
      return vnode.props ? name in vnode.props : false
    }
    v.appendChild = (child: unknown) => {
      if (child instanceof Node) {
        vnode.children.push({ _brand: VNODE_BRAND, type: EXISTING_NODE, props: null, children: [], _el: child })
      } else if (isVNode(child) || isVTextNode(child)) {
        vnode.children.push(child)
      }
      return child
    }
    v.tagName = type.toUpperCase()
    v.nodeName = type.toUpperCase()
  }

  return vnode
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shallow-compares two props objects. Returns true if all keys and values match.
 */
export const shallowEqual = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): boolean => {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

/**
 * Converts a render result (VNode | HTMLElement | string | null) into a flat
 * VChild array suitable for `patchChildren`.
 *
 * Real DOM elements can appear here when component state stores elements created
 * outside renderMode (e.g. in async callbacks like Router's `updateUrl`).
 */
export const toVChildArray = (renderResult: unknown): VChild[] => {
  if (renderResult === null || renderResult === undefined) return []
  if (typeof renderResult === 'string' || typeof renderResult === 'number') {
    return [{ _brand: VTEXT_BRAND, text: String(renderResult) }]
  }
  if (isVNode(renderResult)) {
    if (renderResult.type === FRAGMENT) return renderResult.children
    return [renderResult]
  }
  // Real DOM element (from async code that ran outside renderMode)
  if (renderResult instanceof DocumentFragment) {
    return Array.from(renderResult.childNodes).map((node) => ({
      _brand: VNODE_BRAND as typeof VNODE_BRAND,
      type: EXISTING_NODE,
      props: null,
      children: [] as VChild[],
      _el: node,
    }))
  }
  if (renderResult instanceof Node) {
    return [{ _brand: VNODE_BRAND, type: EXISTING_NODE, props: null, children: [], _el: renderResult }]
  }
  return []
}

// ---------------------------------------------------------------------------
// Props / style application
// ---------------------------------------------------------------------------

const setProp = (el: Element, key: string, value: unknown): void => {
  if (key === 'ref') return
  if (key === 'style' && typeof value === 'object' && value !== null) {
    for (const [sk, sv] of Object.entries(value as Record<string, string>)) {
      ;((el as HTMLElement).style as unknown as Record<string, string>)[sk] = sv
    }
    return
  }

  if (el instanceof SVGElement) {
    if (key === 'className') {
      el.setAttribute('class', String(value))
    } else if (key.startsWith('on') && typeof value === 'function') {
      ;(el as unknown as Record<string, unknown>)[key] = value
    } else if (value === null || value === undefined || value === false) {
      el.removeAttribute(key)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      el.setAttribute(key, String(value))
    }
    return
  }

  if (key.startsWith('data-') || key.startsWith('aria-')) {
    el.setAttribute(key, typeof value === 'string' ? value : '')
  } else {
    ;(el as unknown as Record<string, unknown>)[key] = value
  }
}

const removeProp = (el: Element, key: string): void => {
  if (key === 'ref') return
  if (el instanceof SVGElement) {
    el.removeAttribute(key === 'className' ? 'class' : key)
    return
  }

  if (key === 'style') {
    el.removeAttribute('style')
  } else if (key.startsWith('data-') || key.startsWith('aria-')) {
    el.removeAttribute(key)
  } else if (key.startsWith('on')) {
    ;(el as unknown as Record<string, unknown>)[key] = null
  } else {
    try {
      ;(el as unknown as Record<string, unknown>)[key] = ''
    } catch {
      // Some properties are read-only
    }
  }
}

const patchStyle = (
  el: Element,
  oldStyle: Record<string, string> | undefined,
  newStyle: Record<string, string> | undefined,
): void => {
  const style = (el as HTMLElement).style as unknown as Record<string, string>
  const oldS = oldStyle || {}
  const newS = newStyle || {}
  for (const key of Object.keys(oldS)) {
    if (!(key in newS)) {
      style[key] = ''
    }
  }
  for (const [key, value] of Object.entries(newS)) {
    if (oldS[key] !== value) {
      style[key] = value
    }
  }
}

/**
 * Applies all props to a freshly created element (initial mount).
 */
const applyProps = (el: Element, props: Record<string, unknown> | null): void => {
  if (!props) return
  for (const [key, value] of Object.entries(props)) {
    setProp(el, key, value)
  }
}

/**
 * Diffs old and new props and applies minimal updates to a live DOM element.
 */
export const patchProps = (
  el: Element,
  oldProps: Record<string, unknown> | null,
  newProps: Record<string, unknown> | null,
): void => {
  const oldP = oldProps || {}
  const newP = newProps || {}

  // Remove props that no longer exist
  for (const key of Object.keys(oldP)) {
    if (!(key in newP)) {
      removeProp(el, key)
    }
  }

  // Add / update props
  for (const [key, value] of Object.entries(newP)) {
    if (key === 'style') {
      patchStyle(el, oldP.style as Record<string, string> | undefined, value as Record<string, string> | undefined)
    } else if (oldP[key] !== value) {
      setProp(el, key, value)
    }
  }
}

// ---------------------------------------------------------------------------
// Mount  (VNode tree → real DOM)
// ---------------------------------------------------------------------------

/**
 * Creates real DOM nodes from a VChild and optionally appends to a parent.
 * Sets `_el` on the VChild so subsequent patches can find the DOM node.
 * @returns The created DOM node.
 */
export const mountChild = (child: VChild, parent: Node | null): Node => {
  if (child._brand === VTEXT_BRAND) {
    const text = document.createTextNode(child.text)
    child._el = text
    if (parent) parent.appendChild(text)
    return text
  }

  // Pre-existing real DOM node (from shadeChildren)
  if (child.type === EXISTING_NODE) {
    if (parent && child._el) parent.appendChild(child._el)
    return child._el as Node
  }

  // Shade component
  if (typeof child.type === 'function') {
    const factory = child.type as (props: unknown, children?: ChildrenList) => JSX.Element
    const el = factory(child.props || {}, child.children as unknown as ChildrenList)
    child._el = el
    if (parent) parent.appendChild(el)
    return el
  }

  // Intrinsic element
  const tag = child.type as string
  const el = isSvgTag(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag)
  applyProps(el, child.props)
  child._el = el

  for (const c of child.children) {
    mountChild(c, el)
  }

  if (parent) parent.appendChild(el)

  // Set ref after the element is fully created and appended
  const ref = child.props?.ref as RefObject<Element> | undefined
  if (ref) {
    ;(ref as { current: Element | null }).current = el
  }

  return el
}

// ---------------------------------------------------------------------------
// Unmount  (remove real DOM)
// ---------------------------------------------------------------------------

/**
 * Removes the DOM node associated with a VChild from its parent.
 */
export const unmountChild = (child: VChild): void => {
  // Clear ref before removing from DOM
  if (child._brand === VNODE_BRAND && child.props?.ref) {
    ;(child.props.ref as { current: Element | null }).current = null
  }

  const node = child._el
  if (node?.parentNode) {
    node.parentNode.removeChild(node)
  }
}

// ---------------------------------------------------------------------------
// Patch  (diff old VNode tree vs new VNode tree → DOM updates)
// ---------------------------------------------------------------------------

/**
 * Patches a single old/new VChild pair. Updates the real DOM in place when
 * possible, or replaces the DOM node when types differ.
 */
const patchChild = (_parentEl: Node, oldChild: VChild, newChild: VChild): void => {
  // Both text nodes
  if (oldChild._brand === VTEXT_BRAND && newChild._brand === VTEXT_BRAND) {
    if (oldChild.text !== newChild.text && oldChild._el) {
      oldChild._el.textContent = newChild.text
    }
    newChild._el = oldChild._el
    return
  }

  // Both element/component VNodes with the same type
  if (oldChild._brand === VNODE_BRAND && newChild._brand === VNODE_BRAND && oldChild.type === newChild.type) {
    if (oldChild.type === EXISTING_NODE) {
      // --- Pre-existing DOM node ---
      newChild._el = newChild._el || oldChild._el
      if (oldChild._el !== newChild._el && oldChild._el?.parentNode) {
        oldChild._el.parentNode.replaceChild(newChild._el!, oldChild._el)
      }
      return
    }

    if (typeof oldChild.type === 'function') {
      // --- Shade component boundary ---
      const el = oldChild._el as JSX.Element
      newChild._el = el

      const propsChanged = !shallowEqual(oldChild.props, newChild.props)
      // For children, reference check is enough -- if the parent re-rendered,
      // the children VNodes are always fresh objects, so we compare lengths
      // and item identity as a fast heuristic.
      const childrenChanged =
        oldChild.children.length !== newChild.children.length ||
        oldChild.children.some((c, i) => c !== newChild.children[i])

      if (propsChanged || childrenChanged) {
        if (propsChanged) {
          el.props = newChild.props
          patchProps(el, oldChild.props, newChild.props)
        }
        el.shadeChildren = newChild.children as unknown as ChildrenList
        el.updateComponent()
      }
      return
    }

    // --- Intrinsic element ---
    const el = oldChild._el as Element
    newChild._el = el
    patchProps(el, oldChild.props, newChild.props)
    patchChildren(el, oldChild.children, newChild.children)

    // Update refs: clear old ref if different, set new ref
    const oldRef = oldChild.props?.ref as RefObject<Element> | undefined
    const newRef = newChild.props?.ref as RefObject<Element> | undefined
    if (oldRef !== newRef) {
      if (oldRef) (oldRef as { current: Element | null }).current = null
      if (newRef) (newRef as { current: Element | null }).current = el
    }
    return
  }

  // Types differ → replace
  const oldNode = oldChild._el
  if (oldNode && oldNode.parentNode) {
    const newNode = mountChild(newChild, null)
    oldNode.parentNode.replaceChild(newNode, oldNode)
  } else {
    mountChild(newChild, _parentEl)
  }
}

/**
 * Reconciles an array of old VChildren against new VChildren inside a parent
 * DOM element. Patches matching pairs, removes excess old children, and
 * mounts excess new children.
 *
 * **Note:** This uses positional (index-based) matching, not key-based
 * reconciliation. Reordering list items will cause all children from the
 * reorder point onward to be patched/replaced rather than moved. For
 * dynamic lists where order changes frequently, wrap each item in its own
 * Shade component so that the component boundary prevents unnecessary
 * inner-DOM churn.
 */
export const patchChildren = (parentEl: Node, oldChildren: VChild[], newChildren: VChild[]): void => {
  const commonLen = Math.min(oldChildren.length, newChildren.length)

  for (let i = 0; i < commonLen; i++) {
    patchChild(parentEl, oldChildren[i], newChildren[i])
  }

  // Remove excess old children (iterate backwards to avoid index issues)
  for (let i = oldChildren.length - 1; i >= commonLen; i--) {
    unmountChild(oldChildren[i])
  }

  // Mount excess new children
  for (let i = commonLen; i < newChildren.length; i++) {
    mountChild(newChildren[i], parentEl)
  }
}
