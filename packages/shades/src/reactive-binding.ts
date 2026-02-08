import type { ObservableValue } from '@furystack/utils'
import { getRenderContext } from './render-context.js'

let bindingCounter = 0

const toStr = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return `${value}`
  return JSON.stringify(value)
}

/**
 * Creates a reactive text node that automatically updates when the observable value changes.
 * If a render context is active, the subscription is registered for automatic cleanup on component unmount.
 *
 * @param observable The observable value to bind to
 * @returns A Text node that reactively updates its content
 */
export const createReactiveTextNode = (observable: ObservableValue<unknown>): Text => {
  const textNode = document.createTextNode(toStr(observable.getValue()))
  const context = getRenderContext()

  const subscription = observable.subscribe((newValue) => {
    textNode.textContent = toStr(newValue)
  })

  if (context) {
    const key = `__reactive-text-${bindingCounter++}`
    context.useDisposable(key, () => subscription)
  }

  return textNode
}

/**
 * Creates a reactive attribute binding that automatically updates when the observable value changes.
 * If a render context is active, the subscription is registered for automatic cleanup.
 *
 * @param element The target element
 * @param attrName The attribute name to bind
 * @param observable The observable value to bind to
 */
export const createReactiveAttribute = (
  element: HTMLElement,
  attrName: string,
  observable: ObservableValue<unknown>,
): void => {
  const context = getRenderContext()

  const initialValue = observable.getValue()
  if (initialValue != null) {
    element.setAttribute(attrName, toStr(initialValue))
  }

  const subscription = observable.subscribe((newValue) => {
    if (newValue != null) {
      element.setAttribute(attrName, toStr(newValue))
    } else {
      element.removeAttribute(attrName)
    }
  })

  if (context) {
    const key = `__reactive-attr-${attrName}-${bindingCounter++}`
    context.useDisposable(key, () => subscription)
  }
}

/**
 * Creates a reactive style binding that automatically updates a single CSS property
 * when the observable value changes. Uses camelCase property names (like el.style[prop]).
 *
 * @param element The target element
 * @param prop The CSS property name (camelCase, e.g. 'fontSize')
 * @param observable The observable value to bind to
 */
export const createReactiveStyle = (element: HTMLElement, prop: string, observable: ObservableValue<unknown>): void => {
  const context = getRenderContext()

  const initialValue = observable.getValue()
  if (initialValue != null) {
    ;(element.style as unknown as Record<string, string>)[prop] = toStr(initialValue)
  }

  const subscription = observable.subscribe((newValue) => {
    if (newValue != null) {
      ;(element.style as unknown as Record<string, string>)[prop] = toStr(newValue)
    } else {
      ;(element.style as unknown as Record<string, string>)[prop] = ''
    }
  })

  if (context) {
    const key = `__reactive-style-${prop}-${bindingCounter++}`
    context.useDisposable(key, () => subscription)
  }
}

/**
 * Creates a reactive DOM property binding that automatically updates a property
 * when the observable value changes. Used for properties like className, onclick, etc.
 *
 * @param element The target element
 * @param propName The DOM property name
 * @param observable The observable value to bind to
 */
export const createReactiveProperty = (
  element: HTMLElement,
  propName: string,
  observable: ObservableValue<unknown>,
): void => {
  const context = getRenderContext()

  ;(element as unknown as Record<string, unknown>)[propName] = observable.getValue()

  const subscription = observable.subscribe((newValue) => {
    ;(element as unknown as Record<string, unknown>)[propName] = newValue
  })

  if (context) {
    const key = `__reactive-prop-${propName}-${bindingCounter++}`
    context.useDisposable(key, () => subscription)
  }
}
