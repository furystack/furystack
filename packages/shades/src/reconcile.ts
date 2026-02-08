/**
 * DOM Reconciliation algorithm for @furystack/shades
 *
 * Patches existing DOM nodes in place rather than destroying and recreating them.
 * This preserves focus, scroll positions, CSS animations, and child component state.
 */

/**
 * WeakMap storing JSX props for elements, used by the reconciler
 * to sync event handlers and DOM properties between renders.
 */
export const elementPropsMap = new WeakMap<HTMLElement, Record<string, unknown>>()

/**
 * Stores JSX props on an element for later use by the reconciler.
 * @param el The element to store props for
 * @param props The props to store
 */
export const setElementProps = (el: HTMLElement, props: Record<string, unknown>): void => {
  elementPropsMap.set(el, props)
}

/**
 * Checks if a node is a Shade custom element.
 * Detects both autonomous custom elements (hyphenated tag name) and
 * customized built-in elements (e.g. `<div is="shade-paper">`).
 */
const isShadeElement = (node: Node): node is JSX.Element => {
  return node instanceof HTMLElement && typeof (node as unknown as JSX.Element).callConstructed === 'function'
}

/**
 * Gets the reconciliation key for a node.
 * Supports both `data-sh-key` (attribute) and `key` (DOM property set via JSX).
 */
const getKey = (node: Node): string | null => {
  if (node instanceof HTMLElement) {
    return node.getAttribute('data-sh-key') || (node as unknown as Record<string, string | undefined>).key || null
  }
  return null
}

/**
 * Patches standard HTML attributes from an incoming element onto an existing element.
 * Skips the `style` attribute which is handled separately by per-property style sync.
 */
const patchAttributes = (existing: HTMLElement, incoming: HTMLElement): void => {
  const existingAttrNames = new Set<string>()
  for (let i = 0; i < existing.attributes.length; i++) {
    const { name } = existing.attributes[i]
    if (name !== 'style') {
      existingAttrNames.add(name)
    }
  }
  for (let i = 0; i < incoming.attributes.length; i++) {
    const { name, value } = incoming.attributes[i]
    if (name === 'style') continue
    if (existing.getAttribute(name) !== value) {
      existing.setAttribute(name, value)
    }
    existingAttrNames.delete(name)
  }
  for (const name of existingAttrNames) {
    existing.removeAttribute(name)
  }
}

/**
 * Patches inline styles per-property from an incoming element onto an existing element.
 */
const patchStyles = (existing: HTMLElement, incoming: HTMLElement): void => {
  const existingStyleProps = new Set<string>()
  for (let i = 0; i < existing.style.length; i++) {
    existingStyleProps.add(existing.style[i])
  }
  for (let i = 0; i < incoming.style.length; i++) {
    const prop = incoming.style[i]
    const value = incoming.style.getPropertyValue(prop)
    const priority = incoming.style.getPropertyPriority(prop)
    if (existing.style.getPropertyValue(prop) !== value || existing.style.getPropertyPriority(prop) !== priority) {
      existing.style.setProperty(prop, value, priority)
    }
    existingStyleProps.delete(prop)
  }
  for (const prop of existingStyleProps) {
    existing.style.removeProperty(prop)
  }
}

/**
 * Patches DOM properties (event handlers and other non-attribute properties)
 * from the incoming element's stored JSX props onto the existing element.
 */
const patchProperties = (existing: HTMLElement, incoming: HTMLElement): void => {
  const existingProps = elementPropsMap.get(existing)
  const incomingProps = elementPropsMap.get(incoming)

  if (existingProps) {
    for (const key of Object.keys(existingProps)) {
      if (key.startsWith('on') && (!incomingProps || !(key in incomingProps))) {
        ;(existing as unknown as Record<string, unknown>)[key] = null
      }
    }
  }

  if (incomingProps) {
    for (const key of Object.keys(incomingProps)) {
      if (key === 'style' || key.startsWith('data-') || key.startsWith('aria-')) continue
      const incomingValue = incomingProps[key]
      if (key.startsWith('on') || (existing as unknown as Record<string, unknown>)[key] !== incomingValue) {
        ;(existing as unknown as Record<string, unknown>)[key] = incomingValue
      }
    }
    elementPropsMap.set(existing, incomingProps)
  }

  if (incoming instanceof HTMLInputElement && existing instanceof HTMLInputElement) {
    if (existing.value !== incoming.value) existing.value = incoming.value
    if (existing.checked !== incoming.checked) existing.checked = incoming.checked
    if (existing.disabled !== incoming.disabled) existing.disabled = incoming.disabled
  }
  if (incoming instanceof HTMLTextAreaElement && existing instanceof HTMLTextAreaElement) {
    if (existing.value !== incoming.value) existing.value = incoming.value
  }
  if (incoming instanceof HTMLSelectElement && existing instanceof HTMLSelectElement) {
    if (existing.value !== incoming.value) existing.value = incoming.value
  }
}

/**
 * Fully patches an existing regular HTML element to match an incoming element.
 * Updates attributes, styles, and DOM properties.
 */
const patchElement = (existing: HTMLElement, incoming: HTMLElement): void => {
  patchAttributes(existing, incoming)
  patchStyles(existing, incoming)
  patchProperties(existing, incoming)
}

/**
 * Reconciles a single node pair.
 * @returns The resulting node in the DOM (either the existing node or its replacement)
 */
const reconcileNode = (parent: Element, existing: ChildNode, incoming: ChildNode): ChildNode => {
  if (existing === incoming) {
    return existing
  }

  if (existing.nodeType === Node.TEXT_NODE && incoming.nodeType === Node.TEXT_NODE) {
    if (existing.textContent !== incoming.textContent) {
      existing.textContent = incoming.textContent
    }
    return existing
  }

  if (
    existing.nodeType === Node.ELEMENT_NODE &&
    incoming.nodeType === Node.ELEMENT_NODE &&
    (existing as Element).tagName === (incoming as Element).tagName
  ) {
    const existingEl = existing as HTMLElement
    const incomingEl = incoming as HTMLElement

    if (isShadeElement(existingEl)) {
      // Always replace Shade elements — they manage their own lifecycle via
      // connectedCallback/constructed, and may have internal state (useState,
      // useDisposable) that cannot be updated from outside.
      parent.replaceChild(incoming, existing)
      return incoming
    } else {
      patchElement(existingEl, incomingEl)
      reconcileChildren(existingEl, Array.from(incomingEl.childNodes))
    }
    return existing
  }

  parent.replaceChild(incoming, existing)
  return incoming
}

/**
 * Reconciles children using positional matching (no keys).
 */
const reconcilePositionalChildren = (
  parent: Element,
  existingChildren: ChildNode[],
  newChildren: ChildNode[],
): void => {
  const maxLen = Math.max(existingChildren.length, newChildren.length)
  for (let i = 0; i < maxLen; i++) {
    const existing = existingChildren[i]
    const incoming = newChildren[i]
    if (existing && incoming) {
      reconcileNode(parent, existing, incoming)
    } else if (incoming) {
      parent.appendChild(incoming)
    } else if (existing) {
      parent.removeChild(existing)
    }
  }
}

/**
 * Reconciles children using key-based matching for stable list identity.
 */
const reconcileKeyedChildren = (parent: Element, existingChildren: ChildNode[], newChildren: ChildNode[]): void => {
  const existingByKey = new Map<string, ChildNode>()
  const existingUnkeyed: ChildNode[] = []
  for (const child of existingChildren) {
    const key = getKey(child)
    if (key !== null) {
      existingByKey.set(key, child)
    } else {
      existingUnkeyed.push(child)
    }
  }

  const consumed = new Set<ChildNode>()
  let unkeyedIdx = 0
  const resultNodes: ChildNode[] = []

  for (const newChild of newChildren) {
    const key = getKey(newChild)
    let match: ChildNode | undefined

    if (key !== null) {
      match = existingByKey.get(key)
    } else {
      match = existingUnkeyed[unkeyedIdx++]
    }

    if (match) {
      consumed.add(match)
      const resultNode = reconcileNode(parent, match, newChild)
      resultNodes.push(resultNode)
    } else {
      resultNodes.push(newChild)
    }
  }

  for (const child of existingChildren) {
    if (!consumed.has(child) && child.parentNode === parent) {
      parent.removeChild(child)
    }
  }

  for (let i = 0; i < resultNodes.length; i++) {
    const child = resultNodes[i]
    const currentAtPosition = parent.childNodes[i]
    if (currentAtPosition !== child) {
      parent.insertBefore(child, currentAtPosition || null)
    }
  }
}

/**
 * Reconciles the children of a parent element against a list of new child nodes.
 */
const reconcileChildren = (parent: Element, newChildren: ChildNode[]): void => {
  const existingChildren = Array.from(parent.childNodes)

  const hasAnyKeys = existingChildren.some((c) => getKey(c) !== null) || newChildren.some((c) => getKey(c) !== null)

  if (hasAnyKeys) {
    reconcileKeyedChildren(parent, existingChildren, newChildren)
  } else {
    reconcilePositionalChildren(parent, existingChildren, newChildren)
  }
}

/**
 * Main reconciliation entry point.
 * Reconciles the existing children of a parent element with a new render result.
 *
 * @param parent The parent element whose children should be updated
 * @param newContent The new content to reconcile against (HTMLElement or DocumentFragment)
 */
export const reconcile = (parent: Element, newContent: HTMLElement | DocumentFragment): void => {
  const newChildren =
    newContent instanceof DocumentFragment ? Array.from(newContent.childNodes) : [newContent as ChildNode]

  reconcileChildren(parent, newChildren)
}
