import { generateCSS } from './css-generator.js'
import type { CSSObject } from './models/css-object.js'
import type { Shade } from './shade.js'

/**
 * Owns a shared `<style data-shades-styles>` element in `document.head`
 * and dedupes component-style registration. Internal — consumers use
 * the {@link StyleManager} singleton.
 */
class StyleManagerClass {
  private styleElement: HTMLStyleElement | null = null
  private registeredComponents = new Set<string>()

  private getStyleElement(): HTMLStyleElement {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style')
      this.styleElement.setAttribute('data-shades-styles', '')
      document.head.appendChild(this.styleElement)
    }
    return this.styleElement
  }

  /**
   * Registers CSS styles for a component.
   * Styles are only injected once per component (based on the custom element name).
   *
   * @param customElementName - The custom element tag name (used as CSS selector)
   * @param cssObject - The CSSObject containing styles and nested selectors
   * @param elementBaseName - Optional base element name for customized built-in elements (e.g., 'a', 'button').
   *                          When provided, generates selector like `a[is="component-name"]` instead of `component-name`
   * @returns True if styles were injected, false if already registered
   *
   * @example
   * ```typescript
   * // Regular custom element
   * StyleManager.registerComponentStyles('my-button', {
   *   padding: '12px',
   *   '&:hover': { backgroundColor: 'blue' }
   * })
   *
   * // Customized built-in element (extends anchor)
   * StyleManager.registerComponentStyles('my-link', {
   *   color: 'blue',
   *   '&:hover': { textDecoration: 'underline' }
   * }, 'a')
   * // Generates: a[is="my-link"] { color: blue; }
   * ```
   */
  public registerComponentStyles(customElementName: string, cssObject: CSSObject, elementBaseName?: string): boolean {
    if (this.registeredComponents.has(customElementName)) {
      return false
    }

    const selector = elementBaseName ? `${elementBaseName}[is="${customElementName}"]` : customElementName
    const css = generateCSS(selector, cssObject)
    if (css) {
      const styleElement = this.getStyleElement()
      styleElement.textContent += `\n/* ${customElementName} */\n${css}\n`
      this.registeredComponents.add(customElementName)
      return true
    }

    return false
  }

  public isRegistered(customElementName: string): boolean {
    return this.registeredComponents.has(customElementName)
  }

  /** Snapshot of registered component names. Intended for diagnostics + tests. */
  public getRegisteredComponents(): ReadonlySet<string> {
    return this.registeredComponents
  }

  /** Removes the shared style element and clears the registration set. Test-only. */
  public clear(): void {
    this.registeredComponents.clear()
    if (this.styleElement) {
      this.styleElement.textContent = ''
      this.styleElement.remove()
      this.styleElement = null
    }
  }
}

/**
 * Process-wide CSS injection registry for Shade components. The {@link Shade}
 * factory calls `registerComponentStyles` automatically; direct use is rare
 * (e.g. injecting a third-party stylesheet keyed off a component name).
 */
export const StyleManager = new StyleManagerClass()
