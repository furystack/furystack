/**
 * DOM morphing algorithm for Shades.
 *
 * Instead of replacing the entire subtree on each render, this module diffs
 * the newly rendered DOM tree against the existing one and applies minimal patches.
 * This preserves focus state, form values, CSS animations, and scroll positions.
 */

/**
 * WeakMap storing the original JSX props for each element created by the JSX factory.
 * Used during morphing to transfer properties (event handlers, etc.) that are not
 * reflected as DOM attributes.
 */
export const elementPropsMap = new WeakMap<HTMLElement, Record<string, unknown>>()

/**
 * Stores the JSX props for an element, to be read later during morphing.
 * @param el The DOM element
 * @param props The props passed to the JSX factory
 */
export const storeElementProps = (el: HTMLElement, props: Record<string, unknown> | null | undefined): void => {
  if (props) {
    elementPropsMap.set(el, props)
  }
}

/**
 * Checks if a node is a Shade component (a custom element with an updateComponent method).
 */
const isShadeElement = (node: Node): node is JSX.Element => {
  return (
    node instanceof HTMLElement &&
    'updateComponent' in node &&
    typeof (node as Record<string, unknown>).updateComponent === 'function'
  )
}

/**
 * Properties that should be skipped during property patching because they are
 * handled via attribute syncing or are not direct DOM properties.
 */
const shouldSkipProperty = (key: string): boolean => {
  return key === 'style' || key === 'children' || key.startsWith('data-') || key.startsWith('aria-')
}

/**
 * Syncs all DOM attributes from newEl onto oldEl.
 * Adds new attributes, updates changed ones, and removes stale ones.
 */
const patchAttributes = (oldEl: Element, newEl: Element): void => {
  // Remove attributes present on old but not on new
  for (let i = oldEl.attributes.length - 1; i >= 0; i--) {
    const attr = oldEl.attributes[i]
    if (!newEl.hasAttribute(attr.name)) {
      oldEl.removeAttribute(attr.name)
    }
  }
  // Add or update attributes from new element
  for (let i = 0; i < newEl.attributes.length; i++) {
    const attr = newEl.attributes[i]
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value)
    }
  }
}

/**
 * Transfers JS properties (event handlers, etc.) from the new element to the old element
 * using the stored props from the JSX factory.
 */
const patchProperties = (oldEl: HTMLElement, newEl: HTMLElement): void => {
  const newProps = elementPropsMap.get(newEl)
  const oldProps = elementPropsMap.get(oldEl)

  if (!newProps && !oldProps) return

  // Remove old event handlers that are no longer present in new props
  if (oldProps) {
    for (const key of Object.keys(oldProps)) {
      if (shouldSkipProperty(key)) continue
      if (!newProps || !(key in newProps)) {
        if (key.startsWith('on')) {
          ;(oldEl as unknown as Record<string, unknown>)[key] = null
        }
      }
    }
  }

  // Apply new properties
  if (newProps) {
    for (const [key, value] of Object.entries(newProps)) {
      if (shouldSkipProperty(key)) continue
      if ((oldEl as unknown as Record<string, unknown>)[key] !== value) {
        ;(oldEl as unknown as Record<string, unknown>)[key] = value
      }
    }
  }

  // Update stored props reference for the old element
  if (newProps) {
    elementPropsMap.set(oldEl, newProps)
  } else {
    elementPropsMap.delete(oldEl)
  }
}

/**
 * Patches a regular HTML element: syncs attributes and properties.
 */
const patchElement = (oldEl: HTMLElement, newEl: HTMLElement): void => {
  patchAttributes(oldEl, newEl)
  patchProperties(oldEl, newEl)
}

/**
 * Handles a Shade component boundary during morphing.
 * Updates the component's props and children, syncs external attributes,
 * and triggers a re-render without recursing into the component's own subtree.
 */
const morphShadeComponent = <TProps>(oldEl: JSX.Element<TProps>, newEl: JSX.Element<TProps>): void => {
  oldEl.props = newEl.props
  oldEl.shadeChildren = newEl.shadeChildren
  patchAttributes(oldEl, newEl)
  oldEl.updateComponent()
}

/**
 * Morphs a single old child node to match a new child node.
 * If the nodes are compatible (same type and tag), they are patched in place.
 * Otherwise the old node is replaced with the new one.
 */
const morphNode = (parent: Node, oldNode: ChildNode, newNode: ChildNode): void => {
  // Both text nodes - update text content
  if (oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
    if (oldNode.textContent !== newNode.textContent) {
      oldNode.textContent = newNode.textContent
    }
    return
  }

  // Both elements
  if (oldNode.nodeType === Node.ELEMENT_NODE && newNode.nodeType === Node.ELEMENT_NODE) {
    const oldEl = oldNode as HTMLElement
    const newEl = newNode as HTMLElement

    if (oldEl.tagName === newEl.tagName) {
      // Elements with different IDs are considered different entities - replace, don't morph
      if (oldEl.id && newEl.id && oldEl.id !== newEl.id) {
        parent.replaceChild(newNode, oldNode)
        return
      }
      // Shade component boundary - update props, don't recurse into children
      if (isShadeElement(oldEl)) {
        morphShadeComponent(oldEl, newEl as JSX.Element)
        return
      }
      // Regular element - patch and recurse into children
      patchElement(oldEl, newEl)
      morphChildNodes(oldEl, newEl)
      return
    }
  }

  // Incompatible nodes - replace
  parent.replaceChild(newNode, oldNode)
}

/**
 * Internal: morphs children of `parent` to match children of `newParent`.
 * Walks both child lists in parallel by position, morphing compatible pairs,
 * removing excess old children, and appending excess new children.
 */
const morphChildNodes = (parent: Node, newParent: Node): void => {
  const oldChildren = Array.from(parent.childNodes)
  const newChildren = Array.from(newParent.childNodes)

  const commonLen = Math.min(oldChildren.length, newChildren.length)

  for (let i = 0; i < commonLen; i++) {
    morphNode(parent, oldChildren[i], newChildren[i])
  }

  // Remove excess old children (iterate backwards to avoid index shifting)
  for (let i = oldChildren.length - 1; i >= commonLen; i--) {
    parent.removeChild(oldChildren[i])
  }

  // Append excess new children
  for (let i = commonLen; i < newChildren.length; i++) {
    parent.appendChild(newChildren[i])
  }
}

/**
 * Morphs the children of `parent` to match the children of `newContent`.
 * Used when the render result is a DocumentFragment or when recursing into elements.
 * @param parent The existing DOM element whose children should be updated
 * @param newContent A DocumentFragment or Element containing the desired children
 */
export const morphChildren = (parent: Element, newContent: DocumentFragment | Element): void => {
  morphChildNodes(parent, newContent)
}

/**
 * Morphs an existing DOM element to match a newly rendered element.
 * If the elements have the same tag, the old element is patched in place
 * (attributes, properties, and children). If tags differ, the old element
 * is replaced entirely.
 * @param oldEl The existing element currently in the DOM
 * @param newEl The newly rendered element to morph towards
 */
export const morphElement = (oldEl: Element, newEl: Element): void => {
  if (oldEl.tagName !== newEl.tagName) {
    oldEl.parentNode?.replaceChild(newEl, oldEl)
    return
  }

  if (isShadeElement(oldEl)) {
    morphShadeComponent(oldEl, newEl as JSX.Element)
    return
  }

  patchElement(oldEl as HTMLElement, newEl as HTMLElement)
  morphChildNodes(oldEl, newEl)
}
