/**
 * Describes a single SVG path within an icon.
 */
export type IconPath = {
  /** The SVG path `d` attribute */
  d: string
  /** The fill-rule for this path */
  fillRule?: 'evenodd' | 'nonzero'
}

/**
 * Defines an icon as a set of SVG paths with rendering metadata.
 * Icons are lightweight objects containing only path data -- no embedded SVG markup.
 *
 * @example
 * ```typescript
 * const close: IconDefinition = {
 *   paths: [{ d: 'M6 6l12 12M18 6L6 18' }],
 * }
 *
 * const checkCircle: IconDefinition = {
 *   style: 'fill',
 *   paths: [{ d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 ...' }],
 * }
 * ```
 */
export type IconDefinition = {
  /** One or more SVG path definitions that compose the icon */
  paths: IconPath[]
  /**
   * The SVG viewBox for the icon.
   * @default '0 0 24 24'
   */
  viewBox?: string
  /**
   * The rendering style for the icon.
   * - `'stroke'`: Draws outlines with `stroke="currentColor"` and `fill="none"`.
   * - `'fill'`: Draws solid shapes with `fill="currentColor"`.
   * @default 'stroke'
   */
  style?: 'fill' | 'stroke'
  /**
   * The stroke width for stroke-style icons.
   * Only applies when `style` is `'stroke'`.
   * @default 2
   */
  strokeWidth?: number
}
