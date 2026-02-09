import { generateCSS } from './css-generator.js'
import type { CSSObject } from './models/css-object.js'

/**
 * Singleton that manages component CSS injection.
 * Creates and maintains a shared `<style>` element in the document head,
 * and tracks registered component styles to avoid duplicates.
 */
class StyleManagerClass {
  private styleElement: HTMLStyleElement | null = null
  private registeredComponents = new Set<string>()

  /**
   * Gets or creates the shared style element
   * @returns The style element for CSS injection
   */
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
   * @param shadowDomName - The custom element tag name (used as CSS selector)
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
  public registerComponentStyles(shadowDomName: string, cssObject: CSSObject, elementBaseName?: string): boolean {
    if (this.registeredComponents.has(shadowDomName)) {
      return false
    }

    const selector = elementBaseName ? `${elementBaseName}[is="${shadowDomName}"]` : shadowDomName
    const css = generateCSS(selector, cssObject)
    if (css) {
      const styleElement = this.getStyleElement()
      styleElement.textContent += `\n/* ${shadowDomName} */\n${css}\n`
      this.registeredComponents.add(shadowDomName)
      return true
    }

    return false
  }

  /**
   * Checks if a component's styles have already been registered
   * @param shadowDomName - The component identifier to check
   * @returns True if styles are already registered
   */
  public isRegistered(shadowDomName: string): boolean {
    return this.registeredComponents.has(shadowDomName)
  }

  /**
   * Gets all registered component names (for debugging/testing)
   * @returns Set of registered component names
   */
  public getRegisteredComponents(): ReadonlySet<string> {
    return this.registeredComponents
  }

  /**
   * Clears all registered styles (useful for testing)
   */
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
 * Singleton instance for managing component CSS styles.
 * Use this to register component-level styles that support
 * pseudo-selectors and nested selectors.
 */
export const StyleManager = new StyleManagerClass()
