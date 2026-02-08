import type { CSSObject, CSSProperties } from './models/css-object.js'

/**
 * Converts a camelCase string to kebab-case
 * @param str - The camelCase string to convert
 * @returns The kebab-case string
 * @example
 * camelToKebab('backgroundColor') // 'background-color'
 * camelToKebab('fontSize') // 'font-size'
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

/**
 * Checks if a key is a selector key (starts with '&')
 * @param key - The key to check
 * @returns True if the key is a selector key
 */
export const isSelectorKey = (key: string): boolean => {
  return key.startsWith('&')
}

/**
 * Converts CSS properties to a CSS declaration string
 * @param properties - The CSS properties object
 * @returns A CSS declaration string (e.g., "color: red; padding: 10px;")
 */
export const propertiesToCSSString = (properties: CSSProperties): string => {
  const declarations: string[] = []

  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key) && !isSelectorKey(key)) {
      const value = properties[key as keyof CSSProperties]
      if (value !== undefined && value !== null && value !== '' && typeof value === 'string') {
        declarations.push(`${camelToKebab(key)}: ${value}`)
      }
    }
  }

  return declarations.join('; ')
}

/**
 * Generates a CSS rule string from a selector and properties
 * @param selector - The CSS selector
 * @param properties - The CSS properties object
 * @returns A complete CSS rule string (e.g., "selector { color: red; }")
 */
export const generateCSSRule = (selector: string, properties: CSSProperties): string => {
  const cssString = propertiesToCSSString(properties)
  if (!cssString) {
    return ''
  }
  return `${selector} { ${cssString}; }`
}

/**
 * Generates complete CSS from a CSSObject for a given component selector
 * @param selector - The base selector (typically the tagName)
 * @param cssObject - The CSSObject containing styles and nested selectors
 * @returns A complete CSS string with all rules
 *
 * @example
 * ```typescript
 * generateCSS('my-component', {
 *   color: 'red',
 *   '&:hover': { color: 'blue' },
 *   '& .inner': { fontWeight: 'bold' }
 * })
 * // Returns:
 * // "my-component { color: red; }
 * //  my-component:hover { color: blue; }
 * //  my-component .inner { font-weight: bold; }"
 * ```
 */
export const generateCSS = (selector: string, cssObject: CSSObject): string => {
  const rules: string[] = []

  // Extract base properties (non-selector keys)
  const baseProperties: CSSProperties = {}
  const selectorRules: Array<{ selectorKey: string; properties: CSSProperties }> = []

  for (const key in cssObject) {
    if (Object.prototype.hasOwnProperty.call(cssObject, key)) {
      if (isSelectorKey(key)) {
        const properties = cssObject[key as keyof CSSObject]
        if (properties && typeof properties === 'object') {
          selectorRules.push({ selectorKey: key, properties: properties as CSSProperties })
        }
      } else {
        const value = cssObject[key as keyof CSSObject]
        if (typeof value !== 'object') {
          ;(baseProperties as Record<string, unknown>)[key] = value
        }
      }
    }
  }

  // Generate base rule
  const baseRule = generateCSSRule(selector, baseProperties)
  if (baseRule) {
    rules.push(baseRule)
  }

  // Generate selector rules
  for (const { selectorKey, properties } of selectorRules) {
    // Replace '&' with the base selector
    const fullSelector = selectorKey.replace(/&/g, selector)
    const rule = generateCSSRule(fullSelector, properties)
    if (rule) {
      rules.push(rule)
    }
  }

  return rules.join('\n')
}
