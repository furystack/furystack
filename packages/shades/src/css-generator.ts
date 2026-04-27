import type { CSSObject, CSSProperties } from './models/css-object.js'

/**
 * @example
 * camelToKebab('backgroundColor') // 'background-color'
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

export const isSelectorKey = (key: string): boolean => {
  return key.startsWith('&')
}

/**
 * Serializes the non-selector entries of a {@link CSSProperties} object as
 * a CSS declaration body. Selector keys (`&...`) are skipped.
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

/** Builds `selector { decls; }` from the non-selector entries. Empty when no decls. */
export const generateCSSRule = (selector: string, properties: CSSProperties): string => {
  const cssString = propertiesToCSSString(properties)
  if (!cssString) {
    return ''
  }
  return `${selector} { ${cssString}; }`
}

/**
 * Renders a {@link CSSObject} as CSS rules. Base properties become a single
 * rule against `selector`; each `&...` selector key produces an additional
 * rule with `&` substituted for `selector`.
 *
 * @example
 * ```typescript
 * generateCSS('my-component', {
 *   color: 'red',
 *   '&:hover': { color: 'blue' },
 *   '& .inner': { fontWeight: 'bold' }
 * })
 * // my-component { color: red; }
 * // my-component:hover { color: blue; }
 * // my-component .inner { font-weight: bold; }
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
